var path        = require("path");
var __          = require("underscore");
var base_router = require(path.join(__dirname, "..", "..", "core", "routes"));

exports = module.exports = function() {
  var webserver = base_router();
    
  webserver.update_settings(function() {
    this.webserver_for = "RNAmutants";
  });
    
  return webserver;
}
