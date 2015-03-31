"use strict";

var BPromise = require("bluebird");
var path     = require("path");
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

  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  webserver: {
    type: Schema.Types.ObjectId,
    ref: "Webserver",
    required: true
  },
  
  created_at: {
    type: Date,
    default: Date.now
  }
});

job_schema.post("save", function(job) {
  if (!job.queue_id) {
    job.submit();
  }
});

_.extend(job_schema.methods, {
  workspace: function() {
    return path.join(basedir, "workspace", this.webserver._id.toString(), this._id.toString());
  },
  
  submit: function() {
    return this.deepPopulateAsync("webserver").then(function(deep_job) {
      return daemon.queue.submit_jobAsync(deep_job.webserver, deep_job);
    }).spread(function(deep_job, queue_id) {
      return deep_job.updateAsync({ queue_id: queue_id, state: "queued" });
    });
  },

  save_and_populate: function() {
    return this.saveAsync().spread(function(job, count) {
      return job.deepPopulateAsync("user webserver");
    });
  }
});
