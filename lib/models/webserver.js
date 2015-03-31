"use strict";

var BPromise  = require("bluebird");
var debug     = require("debug")("rna_central:models:webserver");
var path      = require("path");
var fs        = BPromise.promisifyAll(require("fs-extra"));
var mongoose  = require("mongoose");
var Schema    = mongoose.Schema;
var validate  = require("mongoose-validator");

var webserver_schema = module.exports = new Schema({
  name: {
    type: String,
    trim: true,
    unique: true,
    required: true
  },
  folder: {
    type: String,
    trim: true,
    unique: true,
    required: true,
    validate: [
      validate({
        validator: "matches",
        arguments: /^[A-Za-z0-9\-_]+$/i,
        passIfEmpty: true,
        message: "{VALUE} is not a valid folder name"
      })
    ]
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

_.extend(webserver_schema.methods, {
  router: function() {
    return require(path.join(basedir, "webservers", this.folder));
  },

  build_workspace: function(job) {
    var workspace = job.workspace();
    
    return fs.mkdirsAsync(workspace).return(workspace);
  },
  
  dup_manifest: function(workspace) {
    return BPromise.map(this.router().workspace_files(), function(file_path) {
      return fs.copyAsync(file_path, path.join(workspace, path.basename(file_path))).catch(function(err) {
        (err.missing_files = err.missing_files || []).push(file_path);
        throw err;
      });
    }).return(workspace);
  }
});
