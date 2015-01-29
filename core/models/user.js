"use strict";

var __       = require("underscore");
var mongoose = require("mongoose");
var Schema   = mongoose.Schema;
var validate = require("mongoose-validator");

var UserSchema = module.exports = new Schema({
  email: {
    type: String,
    lowercase: true,
    trim: true,
    unique: true,
    required: true,
    validate: [
      validate({
        validator: "isEmail",
        passIfEmpty: true,
        message: "{VALUE} is not a valid email address"
      })
    ]
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});
