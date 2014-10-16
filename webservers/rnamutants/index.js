var path        = require("path");
var __          = require("underscore");
var base_router = require(path.join(__dirname, "..", "..", "core", "routes"));

exports = module.exports = function() {
  var webserver   = base_router();
  webserver.title = "RNAmutants";
    
  webserver.as_this(function() {
    this.all("*", function(req, res, next) {
      console.log(req.baseUrl);
      next();
    });
    
    
    this.add_tab("Zombies", "/zombie", "index");
    
    console.log(webserver.stack);
  });
    
  return webserver;
}
