"use strict";

var __        = require("underscore");
var BPromise  = require("bluebird");
var debug     = require("debug")("rna_central:warehouse");
var mongoose  = BPromise.promisifyAll(require("mongoose"));
var models    = require("./models");
var warehouse = {};

var proto = module.exports = function(options) {
  debug(options);
  
  __.extend(warehouse, {
    db_uri: options.db_uri || "mongodb://localhost/rna_central",
    db_error: options.db_error || console.error.bind(console, "Connection error:")
  });

  warehouse.__proto__ = proto;
  proto.__proto__     = mongoose;
  
  if (warehouse.connection.readyState === 0) {
    warehouse.connection.on("error", warehouse.db_error);
    process.on("SIGINT", function() {
      warehouse.connection.close(function () {
        console.log("Mongoose disconnected on app termination");
        process.exit(0);
      });
    });
    
    warehouse.connect(warehouse.db_uri);
    models(warehouse);
  }
    
  return warehouse;
};
