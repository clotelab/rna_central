"use strict";

var bluebird = require("bluebird");
var debug    = require("debug")("rna_central:daemon");
var CronJob  = require("cron").CronJob;
var shell    = require("shelljs");
var mustache = require("mustache");
var daemon   = {};
var loaded   = false;

module.exports = function(daemon_functions, crontab) {
  if (!loaded && !daemon_functions) {
    throw new Error("Trying to load the cached daemon before is was ever initialized");
  }
  
  if (!loaded) {
    loaded = true;
    
    if (crontab) {
      daemon = new CronJob(crontab, daemon_functions.on_tick, _.identity, true);
    }
    
    daemon.__proto__             = _.extend(daemon_functions, { queue: daemon });
    daemon_functions.__proto__   = CronJob.prototype;
    daemon_functions.constructor = CronJob;
    
    debug(crontab);
    bluebird.promisifyAll(daemon);
  }
  
  return daemon;
};
