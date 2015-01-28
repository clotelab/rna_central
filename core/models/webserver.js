var __       = require("underscore");
var mongoose = require("mongoose");
var Schema   = mongoose.Schema;
var validate = require("mongoose-validator");

var WebserverSchema = module.exports = new Schema({
  name: {
    type: String,
    lowercase: true,
    trim: true,
    unique: true,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});
