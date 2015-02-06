"use strict";

var debug = require("debug")("rna_central:job_runner");

var proto = module.exports = function() {
  var job_runner = {};

  job_runner.__proto__ = proto;

  return job_runner;
};

_.extend(proto, {
  debug: debug,
  
  submit_job: function(webserver, run, callback) {
    callback(null, run, run._id);
  }
});

