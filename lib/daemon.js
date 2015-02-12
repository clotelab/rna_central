"use strict";

var BPromise = require("bluebird");
var debug    = require("debug")("rna_central:daemon");
var CronJob  = require("cron").CronJob;
var shell    = require("shelljs");
var mustache = require("mustache");
var daemon   = {};
var loaded   = false;

module.exports = function(crontab, daemon_functions) {
  if (!loaded && !(crontab || daemon_functions)) {
    throw new Error("Trying to load the cached daemon before is was ever initialized");
  }
  
  if (!loaded) {
    loaded                       = true;
    daemon                       = new CronJob(crontab, daemon_functions.on_tick, _.identity, true);
    daemon.__proto__             = daemon_functions;
    daemon_functions.__proto__   = CronJob.prototype;
    daemon_functions.constructor = CronJob;
    
    debug(crontab);
    BPromise.promisifyAll(daemon);
  }
  
  return daemon;
};
