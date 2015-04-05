"use strict";

var bluebird   = require("bluebird");
var debug      = require("debug")("rna_central:warehouse");
var mongoose   = bluebird.promisifyAll(require("mongoose"));
var job_schema = require("./models/job");
var warehouse  = {};

var proto = module.exports = function(options) {
  debug(options);
  
  _.extend(warehouse, _.defaults(options, {
    db_uri: "mongodb://localhost/rna_central",
    db_error: console.error.bind(console, "Connection error:")
  }));

  warehouse.__proto__ = proto;
  proto.__proto__     = mongoose;
  
  if (warehouse.connection.readyState === 0) {
    warehouse.connection.on("error", warehouse.db_error);
    process.on("SIGINT", function() {
      warehouse.connection.close(function () {
        debug("Mongoose disconnected on app termination");
        process.exit(0);
      });
    });
    
    warehouse.connect(warehouse.db_uri);
    
    warehouse.Job = warehouse.model("Job", job_schema);
    bluebird.promisifyAll(warehouse.Job);
    bluebird.promisifyAll(warehouse.Job.prototype);
  }
    
  return warehouse;
};
