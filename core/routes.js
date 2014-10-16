var express      = require("express");
var __           = require("underscore");
var methods      = require("methods");
var form_builder = require("./form_builder");
var job_runner   = require("./job_runner");

var exports = module.exports = function(options) {
  /* Default attributes and functions for the core router */
  var base_router_functions = {
    title: "Core",
    tabs: [],
    form_builder: form_builder,
    job_runner: job_runner,
    as_this: function(router_function) {
      router_function.call(this);
    },
    organize_stack: function() {
      /* Any routes that are labeled as core are prioritized below those not labeled core, in the same order */
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
    },
    add_tab: function(formal_name, paths, file, options) {
      var tab_settings = __.extend(options || {}, {
        title: formal_name,
        paths: __.flatten([paths]),
        file:  file
      });
      
      this.tabs = (this.tabs || []).concat(tab_settings);
      
      this.get(tab_settings.paths, __.bind(function(req, res, next) {
        res.render(tab_settings.file, { current_tab: tab_settings });
      }, this));
    },
    build_form: function() {
      return forms;
    }
  };
  
  /* Default router is a function to handle the request that extends the attributes object */
  var router = __.extend(function(req, res, next) {
    router.handle(req, res, next);
  }, base_router_functions);
  
  /* Update a lot of things using a helper function so that `this` points to the router */
  router.as_this(function() {
    /* Default router inherits from an Express router */
    router.__proto__ = express.Router();
    
    /* All requests need to bind the webserver and relevant req params to locals for the templating engine */
    this.all("*", __.bind(function(req, res, next) {
      res.locals.__               = __;
      res.locals.webserver        = this;
      res.locals.webserver.folder = req.baseUrl;
      
      next();
    }, this));
  
    /* Stock routes */
    this.add_tab("Home",    ["/", "/home"],      "index");
    this.add_tab("About",   ["/about", "/info"], "index");
    this.add_tab("Server",  "/server",           "index");
    this.add_tab("Contact", "/contact",          "index");
    
    /* Label all stock routes as core, so organize_stack can re-prioritize "subclassed" routes */
    /* The only route that gets skipped is the first this.all, because it adds in locals that all tabs need */
    __.each(__.rest(this.stack), function(layer) { layer._core = true; });
    
    /* Wrap all the routing functions so that the routing stack is reorganized after concat-ing to the stack */
    __.each(methods.concat("all"), function(method) {
      this[method] = __.wrap(this.__proto__.__proto__[method], function(wrapped_verb) {
        var response = wrapped_verb.apply(this, __.toArray(arguments).slice(1));
        this.organize_stack();
        return response;
      });
    }, this);
  });
    
  return router;
};
