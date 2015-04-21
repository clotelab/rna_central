"use strict";

var bluebird = require("bluebird");
var debug    = require("debug")("rna_central:daemon");
var CronJob  = require("cron").CronJob;
var shell    = require("shelljs");
var mustache = require("mustache");
var daemon   = {};
var loaded   = false;

module.exports = function(warehouse, daemon_functions, options) {
  if (!loaded && !(warehouse && daemon_functions)) {
    throw new Error("Trying to load the cached daemon before is was ever initialized");
  }

  if (!loaded) {
    loaded = true;

    if (_.isObject(options) && options.on_tick_freq) {
      debug(options.on_tick_freq);

      daemon = new CronJob(options.on_tick_freq, daemon_functions.on_tick, _.identity, true);
    }

    daemon.__proto__             = _.extend({}, daemon_functions, { queue: daemon, warehouse: warehouse });
    daemon.__proto__.__proto__   = CronJob.prototype;
    daemon.__proto__.constructor = CronJob;

    bluebird.promisifyAll(daemon);
  }

  return daemon;
};
