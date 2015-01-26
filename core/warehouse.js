var __       = require("underscore");
var debug    = require("debug")("rna_central:warehouse");
var mongoose = require("mongoose");
var models   = require("./models");

var proto = module.exports = function(options) {
  options = options || {};
  debug(options);
  
  var warehouse = {};

  warehouse.__proto__ = proto;
  proto.__proto__     = mongoose;
  
  warehouse.connect(options.db_uri || "mongodb://localhost/rna_central");
  warehouse.connection.on("error", options.db_error || console.error.bind(console, "Connection error:"));

  return warehouse;
};

__.extend(proto, {
  debug: debug,
  
  User: mongoose.model("User", models.User),
  
  Webserver: mongoose.model("Webserver", models.Webserver),
  
  Run: mongoose.model("Run", models.Run)
});
