"use strict";

var BPromise = require("bluebird");
var path     = require("path");
var fs       = BPromise.promisifyAll(require("fs-extra"));
var mongoose = require("mongoose");
var Schema   = mongoose.Schema;
var validate = require("mongoose-validator");
var daemon   = require("../daemon")();
var states   = "unqueued queued running complete notified error".split(" ");

var job_schema = module.exports = new Schema({
  nickname: String,

  queue_id: String,

  data: {
    type: Schema.Types.Mixed,
    default: function() { return {}; },
    required: true
  },

  state: {
    type: String,
    default: "unqueued",
    enum: states,
    required: true
  },

  email: {
    type: String,
    lowercase: true,
    trim: true,
    required: true,
    validate: [
      validate({
        validator: "isEmail",
        passIfEmpty: true,
        message: "{VALUE} is not a valid email address"
      })
    ]
  },

  webserver_name: {
    type: String,
    trim: true,
    required: true,
    validate: [
      function(value) {
        try {
          require(path.join(basedir, "webservers", value));
          return true;
        } catch (err) {
          return false;
        }
      },
      "{VALUE} is not a valid webserver"
    ]
  },
  
  created_at: {
    type: Date,
    default: Date.now
  }
});

job_schema.virtual("webserver").get(function() {
  return require(path.join(basedir, "webservers", this.webserver_name));
});

job_schema.virtual("workspace_path").get(function() {
  return path.join(basedir, "workspace", this.webserver_name, this._id.toString());
});

job_schema.post("save", function(job) {
  if (!job.queue_id) {
    job.submit();
  }
});

_.extend(job_schema.methods, {
  build_workspace: function() {
    return fs.mkdirsAsync(this.workspace_path).return(this.workspace_path);
  },

  dup_manifest: function(workspace) {
    return BPromise.map(this.webserver.workspace_files(), function(file_path) {
      return fs.copyAsync(file_path, path.join(workspace, path.basename(file_path))).catch(function(err) {
        (err.missing_files = err.missing_files || []).push(file_path);
        throw err;
      });
    }).return(workspace);
  },
  
  submit: function() {
    return daemon.queue.submit_jobAsync(this.webserver, this).spread(function(job, queue_id) {
      return job.updateAsync({ queue_id: queue_id, state: "queued" });
    });
  }
});
