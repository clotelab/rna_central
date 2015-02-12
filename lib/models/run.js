"use strict";

var BPromise = require("bluebird");
var mongoose = require("mongoose");
var Schema   = mongoose.Schema;
var validate = require("mongoose-validator");
var daemon   = require("../daemon")();
var states   = "unqueued queued running complete notified error".split(" ");

var run_schema = module.exports = new Schema({
  nickname: String,
  job_id: String,
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

run_schema.post("save", function(run) {
  if (!run.job_id) {
    run.submit_job();
  }
});

_.extend(run_schema.methods, {
  submit_job: function() {
    return this.deepPopulateAsync("webserver").then(function(deep_run) {
      return daemon.submit_jobAsync(deep_run.webserver, deep_run);
    }).spread(function(deep_run, job_id) {
      return deep_run.updateAsync({ job_id: job_id, state: "queued" });
    });
  },

  save_and_populate: function() {
    return this.saveAsync().spread(function(run, count) {
      return run.deepPopulateAsync("user webserver");
    });
  }
});
