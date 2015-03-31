"use strict";

var BPromise  = require("bluebird");
var debug     = require("debug")("rna_central:models:webserver");
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
  active: {
    type: Boolean,
    default: false
  },
  file_manifest: {
    type: [String],
    default: function() { return []; }
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

_.extend(webserver_schema.methods, {
  build_workspace: function(job) {
    var workspace = job.workspace();
    
    return fs.mkdirAsync(workspace).return(workspace);
  },
  
  dup_manifest: function(workspace) {
    console.log(this);
    
    return BPromise.map(this.file_manifest, function(file_path) {
      return fs.copyAsync(file_path, workspace).catch(function(err) {
        (err.missing_files = err.missing_files || []).push(file_path);
        throw err;
      });
    }).return(workspace);
  }
});
