var __       = require("underscore");
var Promise  = require("bluebird");
var debug    = require("debug")("rna_central:warehouse");
var mongoose = require("mongoose");
var models   = require("./models");

var proto = module.exports = function(options) {
  options = options || {};
  debug(options);
  
  var warehouse = {
    db_uri: options.db_uri || "mongodb://localhost/rna_central",
    db_error: options.db_error || console.error.bind(console, "Connection error:")
  };

  warehouse.__proto__ = proto;
  proto.__proto__     = mongoose;
  
  warehouse.connect(warehouse.db_uri);
  warehouse.connection.on("error", warehouse.db_error);
  models(warehouse);
  Promise.promisifyAll(warehouse);

  return warehouse;
};
