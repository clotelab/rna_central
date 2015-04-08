"use strict";

var bluebird   = require("bluebird");
var debug      = require("debug")("rna_central:warehouse");
var mongoose   = bluebird.promisifyAll(require("mongoose"));
var haikunate  = require("haikunator");
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
    warehouse.establish_connection();

    warehouse.add_model("Job", job_schema);
  }
    
  return warehouse;
};

_.extend(proto, {
  establish_connection: function() {
    warehouse.connection.on("error", warehouse.db_error);
    process.on("SIGINT", function() {
      warehouse.connection.close(function () {
        debug("Mongoose disconnected on app termination");
        process.exit(0);
      });
    });
    
    warehouse.connect(warehouse.db_uri);
  },

  add_model: function(name, schema) {
    schema.statics.haikunate = haikunate;
    warehouse[name]          = warehouse.model(name, schema);
    
    bluebird.promisifyAll(warehouse[name].schema.statics);
    bluebird.promisifyAll(warehouse[name].schema.methods);
  }
});