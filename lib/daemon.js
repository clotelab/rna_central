"use strict";

var __       = require("underscore");
var debug    = require("debug")("rna_central:daemon");
var CronJob  = require("cron").CronJob;
var shell    = require("shelljs");
var mustache = require("mustache");

var proto = module.exports = function(crontab) {
  debug(crontab);
  
  var daemon = new CronJob(crontab, function() {
    if (!shell.which("qstat")) {
      debug(mustache.render("qstat command not found ({{timestamp}})", { timestamp: new Date() }));
      return; 
    }
    
    shell.exec("qstat", __.bind(function(code, output) {
      debug("Exit code:", code);
      debug("Program output:", output);
    }, this));
  }, __.identity, true);
  
  daemon.__proto__  = proto;
  proto.__proto__   = CronJob.prototype;
  proto.constructor = CronJob;
  
  return daemon;
};

__.extend(proto, {
  
});
