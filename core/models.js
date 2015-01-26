var __ = require("underscore");

module.exports = function(warehouse) {
  warehouse.models = __.inject("User Run Webserver".split(" "), function(hash, name) {
    hash[name] = warehouse.model(name, require("./models/" + name.toLowerCase()));
    return hash;
  }, {});
};
