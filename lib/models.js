"use strict";

var BPromise      = require("bluebird");
var deep_populate = BPromise.promisifyAll(require("mongoose-deep-populate"));
var models        = "User Run Webserver".split(" ");

module.exports = function(warehouse) {
  warehouse.models = warehouse.models || {};
  
  _.each(models, function(name) {
    var schema = require("./models/" + name.toLowerCase());
    schema.plugin(deep_populate);
    BPromise.promisifyAll(schema.methods);
    BPromise.promisifyAll(schema.statics);
    
    warehouse.models[name] = warehouse.model(name, schema);
  });
};
