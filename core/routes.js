var express      = require("express");
var __           = require("underscore");
var debug        = require("debug")("rna_central:routes");
var methods      = require("methods");
var form_builder = require("./form_builder");
var job_runner   = require("./job_runner");

var proto = module.exports = function(options) {
  options = options || {};
  debug(options);
  
  /* Default router is a function to handle the request that extends the attributes object */
  function router(req, res, next) {
    router.handle(req, res, next);
  };

  /* Default router inherits from an Express router through this function */
  router.__proto__ = proto;
  proto.__proto__  = express.Router();
  router.title     = options.title || "Core";
  router.debug     = require("debug")("rna_central:webserver:" + router.title.toLowerCase());
  router.tabs      = [];

  /* Wrap all the routing functions so that the routing stack is reorganized after concat-ing to the stack */
  __.each(methods.concat("all"), function(method) {
    proto[method] = __.wrap(proto.__proto__[method], function(wrapped_verb) {
      var response = wrapped_verb.apply(this, __.toArray(arguments).slice(1));
      this.organize_stack();
      return response;
    });
  });

  /* All requests need to bind the webserver and relevant req params to locals for the templating engine */
  router.all("*", function(req, res, next) {
    res.locals.__               = __;
    res.locals.webserver        = router;
    res.locals.webserver.folder = req.baseUrl;

    next();
  });
  
  // router.all("*", function(req, res, next) {
  //   var db         = req.db;
  //   var collection = db.get("usercollection");
  //   collection.find({}, function(err, docs) {
  //     res.locals.users = docs;
  //     debug(res.locals.users);
  //
  //     next();
  //   });
  // });

  /* Stock routes */
  router.add_tab("Home",    ["/", "/home"],      "index");
  router.add_tab("About",   ["/about", "/info"], "index");
  router.add_tab("Server",  "/server",           "server");
  router.add_tab("Contact", "/contact",          "index");

  /* Label all stock routes as core, so organize_stack can re-prioritize "subclassed" routes */
  /* The only route that gets skipped is the first this.all, because it adds in locals that all tabs need */
  __.each(__.rest(router.stack), function(layer) { layer._core = true; });

  return router;
};

__.extend(proto, {
  form_builder: form_builder(),
  
  job_runner: job_runner(),
  
  /* Any routes that are labeled as core are prioritized below those not labeled core, in the same order */
  organize_stack: function() {
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
    this.debug("Adding " + formal_name);
    
    var tab_settings = __.extend(options || {}, {
      title: formal_name,
      paths: __.flatten([paths]),
      file:  file
    });

    this.tabs = (this.tabs || []).concat(tab_settings);

    this.get(tab_settings.paths, __.bind(function(req, res, next) {
      res.render(tab_settings.file, { current_tab: tab_settings });
    }, this));
  }
});
