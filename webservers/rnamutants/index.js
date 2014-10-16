var path        = require("path");
var __          = require("underscore");
var base_router = require(path.join(__dirname, "..", "..", "core", "routes"));

module.exports = function() {
  var webserver = base_router({ title: "RNAmutants" });
    
  webserver.all("*", function(req, res, next) {
    webserver.debug(req.path);
    next();
  });  
  
  webserver.add_tab("Zombies", "/zombie", "index");
    
  return webserver;
};
