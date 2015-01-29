"use strict";

var __       = require("underscore");
var mongoose = require("mongoose");
var Schema   = mongoose.Schema;
var validate = require("mongoose-validator");

var RunSchema = module.exports = new Schema({
  nickname: String,
  data: {
    type: Schema.Types.Mixed,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  job_id: {
    type: String,
    required: true
  },    
  user: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  webserver: {
    type: Schema.Types.ObjectId,
    ref: "Webserver"
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});
