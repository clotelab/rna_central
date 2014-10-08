var express     = require("express");
var methods     = require("methods");
var __          = require("underscore");
var base_router = exports = module.exports = function(options) {
  function router(req, res, next) {
    router.handle(req, res, next);
  }
  
  router.__proto__ = express.Router();
  
  router.organize_stack = function() {
    this.__proto__.stack = __.
                             chain(this.stack.length).
                             range().
                             zip(this.stack).
                             map(function(zipper) { 
                               return (function(index, layer) { 
                                 return [layer, (layer._core === true ? index : -this.stack.length + index)]; 
                               }).apply(this, zipper); 
                             }, this).
                             sortBy("1").
                             pluck("0").
                             value();
  }
  
  router.update_settings = function(context) { context.call(this); };
  router.update_settings(function() {
    this.for = "Core";
    
    this.all("*", __.bind(function(req, res, next) {
      res.locals.req       = req;
      res.locals.webserver = this;
      res.locals.tabs      = [
        { title: "Home",    path: "" },
        { title: "About",   path: "/about" },
        { title: "Server",  path: "/server" },
        { title: "Contact", path: "/contact" }
      ];
      
      next();
    }, this));
  
    this.get(["/", "/home"], __.bind(function(req, res) {
      res.render("index", { current_tab: "Home" });
    }, this));

    this.get(["/about", "/info"], __.bind(function(req, res) {
      res.render("index", { current_tab: "About" });
    }, this));

    this.get("/server", __.bind(function(req, res) {
      res.render("index", { current_tab: "Server" });
    }, this));

    this.get("/contact", __.bind(function(req, res) {
      res.render("index", { current_tab: "Contact" });
    }, this));
    
    __.each(this.stack, function(layer) { layer._core = true; });
  });
  
  __.each(methods.concat("all"), function(method) {
    this[method] = __.wrap(this.__proto__.__proto__[method], function(wrapped_verb) {
      var response = wrapped_verb.apply(this, __.toArray(arguments).slice(1));
      this.organize_stack();
      return response;
    });
  }, router);
  
  return router;
};
