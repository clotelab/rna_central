var __       = require("underscore");
var debug    = require("debug")("rna_central:models");
var mongoose = require("mongoose");
var Schema   = mongoose.Schema;
var validate = require("mongoose-validator");

module.exports = {
  User: new Schema({
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
  }),
  
  Webserver: new Schema({
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
  }),
  
  Run: new Schema({
    nickname: String,
    data: {
      type: Schema.Types.Mixed,
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
  })
};