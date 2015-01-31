"use strict";

var __       = require("underscore");
var mongoose = require("mongoose");
var Schema   = mongoose.Schema;
var validate = require("mongoose-validator");
var states   = "unqueued queued running complete error".split(" ");

var RunSchema = module.exports = new Schema({
  nickname: String,
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
  job_id: {
    type: String,
    // unique: true,
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

__.extend(RunSchema.methods, {
  save_and_populate: function() {
    return this.saveAsync().spread(function(run, count) {
      return run.deepPopulateAsync("user webserver");
    });
  }
});
