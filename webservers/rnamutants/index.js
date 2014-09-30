var express    = require("express");
var __         = require("underscore");
var rna_router = exports = module.exports = (function(options) {
  function router(req, res, next) {
    router.handle(req, res, next);
  }
  
  router.__proto__ = express.Router();
  
  return router;
})();

// _.find(rna_router.__proto__.stack, function(route) { return route.regexp.toString() === "/^\\/?$/i"; })

rna_router.get("/", function(req, res) {
  res.render("index", { title: "RNAmutants" });
});

rna_router.get("/pony", function(req, res) {
  res.render("index", { title: "Pony" });
});
