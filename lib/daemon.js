"use strict";

var bluebird = require("bluebird");
var debug    = require("debug")("rna_central:daemon");
var config   = require("config");
var CronJob  = require("cron").CronJob;

function Daemon() {
  this.queue     = {};
  this.warehouse = null;
}

Daemon.prototype.__proto__   = CronJob.prototype;
Daemon.prototype.constructor = CronJob;

Daemon.prototype.config = function(warehouse, daemon_functions) {
  this.warehouse = warehouse;

  if (process.env.NODE_ENV !== "test") {
    var on_tick_freq = config.get("on_tick_freq");
    this.queue       = new CronJob(on_tick_freq, daemon_functions.on_tick, _.identity, true);

    debug(on_tick_freq);
  }

  _.extend(this.queue, daemon_functions);

  bluebird.promisifyAll(this);

  return this;
};

module.exports = new Daemon();
