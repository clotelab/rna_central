"use strict";

var bluebird   = require("bluebird");
var config     = require("config");
var debug      = require("debug")("rna_central:db");
var mongoose   = bluebird.promisifyAll(require("mongoose"));
var haikunate  = require("haikunator");
var job_schema = require("./models/job");

function Db() {
  this.db_uri   = undefined;
  this.db_error = null;
}

Db.prototype.config = function(options) {
  debug(options);

  _.extend(this, _.defaults(options, {
    db_uri: config.get("db_uri"),
    db_error: console.error.bind(console, "Connection error:")
  }));

  this.__proto__.__proto__ = mongoose;

  if (this.connection.readyState === 0) {
    this.establish_connection();

    this.add_model("Job", job_schema);

    debug("Connected on %s", this.db_uri);
  }

  return this;
};

Db.prototype.establish_connection = function() {
  this.connection.on("error", this.db_error);

  process.on("SIGINT", _.bind(function() {
    this.connection.close(function () {
      debug("Mongoose disconnected on app termination");
      process.exit(0);
    });
  }, this));

  this.connect(this.db_uri);
};

Db.prototype.add_model = function(name, schema) {
  schema.statics.haikunate = haikunate;
  this[name]               = this.model(name, schema);

  bluebird.promisifyAll(this[name].schema.statics);
  bluebird.promisifyAll(this[name].schema.methods);
};

module.exports = new Db();
