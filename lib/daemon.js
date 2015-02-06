"use strict";

var debug    = require("debug")("rna_central:daemon");
var CronJob  = require("cron").CronJob;
var shell    = require("shelljs");
var mustache = require("mustache");

module.exports = function(crontab, daemon_functions) {
  debug(crontab);
  
  var daemon                   = new CronJob(crontab, daemon_functions.on_tick, _.identity, true);
  daemon.__proto__             = daemon_functions;
  daemon_functions.__proto__   = CronJob.prototype;
  daemon_functions.constructor = CronJob;
  
  return daemon;
};
