"use strict";

var bluebird = require("bluebird");
var colors   = require("colors");
var debug    = require("debug")("rna_central:job");
var path     = require("path");
var fs       = bluebird.promisifyAll(require("fs-extra"));
var config   = require("config");
var mongoose = require("mongoose");
var Schema   = mongoose.Schema;
var validate = require("mongoose-validator");
var daemon   = require("../daemon");
var mailer   = require("../mailer");
var socket   = require("../socket");
var states   = "unqueued queued running complete notified error".split(" ");

var job_schema = module.exports = new Schema({
  nickname: {
    type: String,
    required: true
  },

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
        return fs.existsAsync(function() {
          return true;
        }).catch(function() {
          return false;
        });
      },
      "{VALUE} is not a valid webserver"
    ]
  },

  created_at: {
    type: Date,
    default: Date.now
  },

  updated_at: {
    type: Date,
    default: Date.now
  }
});

job_schema.virtual("webserver").get(function() {
  return require(path.join(basedir, "webservers", this.webserver_name));
});

job_schema.virtual("workspace_path").get(function() {
  return path.join(basedir, "workspace", this.webserver_name, this.nickname);
});

job_schema.virtual("workspace_file").get(function() {
  return function(suffix) {
    return path.join(this.workspace_path, this.nickname + suffix);
  };
});

job_schema.virtual("email_url").get(function() {
  return path.join(config.get("email_base_url"), config.get("base_prefix"), this.webserver_name, "jobs", this.nickname);
});

job_schema.pre("validate", function(next) {
  if (this.isNew) {
    this.nickname = job_schema.statics.haikunate();
  }

  next();
});

job_schema.pre("save", function(next) {
  if (_.includes(this.modifiedPaths(), "state")) {
    debug(colors.underline("Job %s (%s) state updating to %s"), this.nickname, this.queue_id, this.state);

    if (_.includes(["complete", "error"], this.state)) {
      mailer.send_mail_about_job(this);
    }
  }

  next();
});

job_schema.post("save", function(job) {
  if (!job.queue_id) {
    job.submit();
  }

  if (job.state === "complete" && process.env.NODE_ENV !== "test") {
    debug(colors.underline("Job %s (%s) is now complete"), job.nickname, job.queue_id);

    socket.io.to(job.nickname).emit("done", job.nickname);

    fs.readdirAsync(job.workspace_path).then(function(files) {
      var full_file_paths = _.map(files, function(file) {
        return path.join(job.workspace_path, file);
      });

      if (job.webserver.finish_job) {
        job.webserver.finish_job.call(job, full_file_paths);
      }
    });
  }
});

_.extend(job_schema.statics, {
  create_job: function(webserver_name, form_data) {
    var job_data = {
      email: form_data.email,
      webserver_name: webserver_name,
      data: _.omit(form_data, "email")
    };

    debug(job_data);

    return this.createAsync(job_data);
  },

  update_by_queue_id: function(queue_id, state) {
    return this.findOneAsync({ queue_id: queue_id }).then(function(job) {
      if (job && job.state !== state) {
        job.state      = state;
        job.updated_at = Date.now();
        return job.saveAsync().spread(function(job) {
          return job;
        });
      }
    });
  }
});

_.extend(job_schema.methods, {
  build_workspace: function() {
    return fs.mkdirsAsync(this.workspace_path).tap(function(workspace_path) {
      debug("Created workspace in %s", workspace_path);
    }).return(this.workspace_path);
  },

  dup_manifest: function(workspace) {
    return bluebird.map(this.webserver.workspace_files(), function(file_path) {
      return fs.copyAsync(file_path, path.join(workspace, path.basename(file_path))).catch(function(err) {
        (err.missing_files = err.missing_files || []).push(file_path);
        throw err;
      });
    }).return(workspace);
  },

  submit: function() {
    var job = this;

    // Called in the job_schema.post("save") hook to submit the job via the underlying daemon and save the queue_id
    return daemon.queue.submit_job(job.webserver, job).then(function(queue_id) {
      debug(colors.underline("Job %s (%s) submitted successfully, flagging as queued"), job.nickname, queue_id);

      return job.updateAsync({ queue_id: queue_id, state: "queued" });
    }).catch(function(err) {
      debug(colors.underline("Job %s had an issue, marking as error"), job.nickname);

      return job.updateAsync({ state: "error" });
    });
  }
});

