var __        = require("underscore");
var BPromise  = require("bluebird");
var debug     = require("debug")("rna_central:warehouse");
var mongoose  = require("mongoose");
var models    = require("./models");
var warehouse = {};

var proto = module.exports = function(options) {
  options = options || {};
  debug(options);
  
  __.extend(warehouse, {
    db_uri: options.db_uri || "mongodb://localhost/rna_central",
    db_error: options.db_error || console.error.bind(console, "Connection error:")
  });

  warehouse.__proto__ = proto;
  proto.__proto__     = mongoose;
  
  warehouse.connection.on("error", warehouse.db_error);
  
  if (warehouse.connection.readyState == false) {
    warehouse.connect(warehouse.db_uri);
    models(warehouse);
    BPromise.promisifyAll(warehouse);
  }
    
  return warehouse;
};
