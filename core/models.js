var __     = require("underscore");
var models = "User Run Webserver".split(" ");

module.exports = function(warehouse) {
  warehouse.models = __.inject(models, function(hash, name) {
    hash[name] = warehouse.model(name, require("./models/" + name.toLowerCase()));
    return hash;
  }, {});
};
