"use strict";

var __       = require("underscore");
var mongoose = require("mongoose");
var Schema   = mongoose.Schema;
var validate = require("mongoose-validator");

var WebserverSchema = module.exports = new Schema({
  name: {
    type: String,
    trim: true,
    unique: true,
    required: true
  },
  active: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});
