var __       = require("underscore");
var debug    = require("debug")("rna_central:warehouse");
var mongoose = require("mongoose");

mongoose.connect("mongodb://localhost/rna_central");

var proto = module.exports = function() {
  var warehouse = {};

  warehouse.__proto__ = proto;
  proto.__proto__     = mongoose;

  return warehouse;
};

__.extend(proto, {
  debug: debug
});
