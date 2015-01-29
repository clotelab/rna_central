"use strict";

var __    = require("underscore");
var debug = require("debug")("rna_central:job_runner");

var proto = module.exports = function() {
  var job_runner = {};

  job_runner.__proto__ = proto;

  return job_runner;
};

__.extend(proto, {
  debug: debug
});
