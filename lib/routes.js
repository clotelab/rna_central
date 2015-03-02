"use strict";

var BPromise     = require("bluebird");
var express      = require("express");
var debug        = require("debug")("rna_central:routes");
var methods      = require("methods");
var path         = require("path");
var glob         = require("glob");
var form_builder = require("./form_builder");

var proto = module.exports = function(options) {
  options = options || {};
  
  /* Default router is a function to handle the request that extends the attributes object */
  function router(req, res, next) {
    router.handle(req, res, next);
  }

  /* Default router inherits from an Express router through this function */
  router.__proto__ = proto;
  proto.__proto__  = express.Router();
  router.dirname   = path.dirname(options.module.filename);
  router.folder    = path.basename(router.dirname);
  router.title     = options.title || "Core";
  router.debug     = require("debug")("rna_central:webserver:" + router.folder);
  router.tabs      = [];

  /* Wrap all the routing functions so that the routing stack is reorganized after concat-ing to the stack */
  /* We do this because stack is a terrible name for this object, it's really a queue; we want new routes at the top  */
  _.each(methods.concat("all"), function(method) {
    proto[method] = _.wrap(proto.__proto__[method], function(wrapped_verb) {
      var response = wrapped_verb.apply(this, _.toArray(arguments).slice(1));
      this.organize_stack();
      return response;
    });
  });

  /* All requests need to bind the webserver and relevant req params to locals for the templating engine */
  router.all("*", function(req, res, next) {
    res.locals._                = _;
    res.locals.webserver        = router;
    res.locals.webserver.folder = req.baseUrl;

    next();
  });

  /* Stock routes, the base route is required; beyond that you can specify an array of routes if you don't like the defaults */
  router.add_tab({ title: "Home", path: ["/", "/home"], template: "index" });

  if (_.isArray(options.tabs)) {
    _.each(options.tabs, router.add_tab, router);
  } else if (options.tabs === "default" || _.isUndefined(options.tabs)) {
    router.add_tab({ title: "About",   path: ["/about", "/info"], template: "index" });
    router.add_tab({ title: "Server",  path: "/server",           template: "server" });
    router.add_tab({ title: "Contact", path: "/contact",          template: "index" });
  }
  
  /* Label all stock routes as core, so organize_stack can re-prioritize "subclassed" routes */
  /* The only route that gets skipped is the first this.all, because it adds in locals that all tabs need */
  _.each(_.rest(router.stack), function(layer) { layer._core = true; });

  return router;
};

_.extend(proto, {
  form_builder: form_builder(),
  
  pbs_command: function(generate_command) {
    this.generate_command = generate_command;
  },
  
  generate_command: function(run) {
    throw new Error("Webserver instances must implement this method");
  },
  
  /* Any routes that are labeled as core are prioritized below those not labeled core, in the same order */
  organize_stack: function() {
    this.__proto__.stack = _.
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
  
  add_tab: function(options) {
    /* Tabs can provide relative paths to their templates. We need to resolve between the two because the paths are webserver-specific */
    options.path       = _.flatten([options.path]); 
    var local_pathname = path.join(this.dirname, options.template + ".@(jade|html)");
    var results        = glob.sync(local_pathname);
    
    if (!_.isEmpty(results)) {
      options.template = _.first(results);
      this.debug("Found custom tab at: " + options.template);
    }
    
    this.tabs = (this.tabs || []).concat(options);

    this.get(options.path, _.bind(function(req, res, next) {
      res.render(options.template, { current_tab: options });
    }, this));
  }
});
