"use strict";

var bluebird      = require("bluebird");
var express       = require("express");
var debug         = require("debug")("rna_central:subapp");
var methods       = require("methods");
var path          = require("path");
var glob          = require("glob");
var form_builder  = require("./form_builder");
var form_renderer = require("./form_renderer");

var proto = module.exports = function(options) {
  options = options || {};

  // Default router is a function to handle the request that extends the attributes object
  function router(req, res, next) {
    router.handle(req, res, next);
  }

  // Default router inherits from an Express router through this function
  router.__proto__          = proto;
  proto.__proto__           = express.Router();
  proto.constructor         = express.Router;
  router.active             = options.active;
  router.dirname            = path.dirname(options.module.filename);
  router.id = router.folder = path.basename(router.dirname);
  router.file_manifest      = options.file_manifest;
  router.title              = options.title;
  router.debug              = require("debug")("rna_central:webserver:" + router.id);
  router.fully_loaded       = false;
  router.tabs               = [];

  // Wrap all the routing functions so that the routing stack is reorganized after concat-ing to the stack
  // We do this because stack is a terrible name for this object, it's really a queue; we want new routes at the top
  _.each(methods.concat("all"), function(method) {
    proto[method] = _.wrap(proto.__proto__[method], function(wrapped_verb) {
      var response = wrapped_verb.apply(this, _.toArray(arguments).slice(1));
      this.organize_stack();
      return response;
    });
  });

  // Attach all the form_builder machinery to the router
  form_builder(router);

  // All requests need to bind the webserver and relevant req params to locals for the templating engine
  router.use(function(req, res, next) {
    _.extend(res.locals, {
      webserver:    router,
      scoped_url:   function(string) {
        return path.join("/", req.state.base_prefix, router.id, string || "");
      },
      render_form:  function(form) {
        return form_renderer(form).to_html();
      }
    });

    next();
  });

  // Stock routes, the base route is required; beyond that you can specify an array of routes if you don't like the defaults
  if (_.isArray(options.tabs)) {
    _.each(options.tabs, router.add_tab, router);
  } else if (options.tabs === "default" || _.isUndefined(options.tabs)) {
    router.add_tab({ title: "Home",    path: ["/", "/home"], template: "home" });
    router.add_tab({ title: "About",   path: "/about",       template: "about" });
    router.add_tab({ title: "Server",  path: "/submit_job",  template: "server" });
  }

  // Parse the nickname out from /jobs/:nickname requests to find the corresponding job
  router.param("nickname", function(req, res, next, nickname) {
    req.state.warehouse.Job.findOneAsync({
      webserver_name: req.state.subapp.id,
      nickname: nickname
    }).then(function(job) {
      router.debug("Pulling info for job %s", nickname);

      req.state.job = job;
    }).finally(next);
  });

  // Handle /jobs/:nickname requests, depending if the job is in progress or not
  router.get("/jobs/:nickname", function(req, res, next) {
    var job = req.state.job;

    if (job) {
      res.locals.page_data = { title: job.nickname };
      res.locals.job         = _.pick.apply(this, [job].concat("nickname webserver_name email state data created_at updated_at".split(" ")));
      res.locals.session     = req.session;

      if (job.state === "complete") {
        router.display_results.call(job, req, res, next);
      } else {
        res.render("job_progress");
      }
    } else {
      next();
    }
  });

  // Label all stock routes as core, so organize_stack can re-prioritize "subclassed" routes
  // The only route that gets skipped is the first this.all, because it adds in locals that all tabs need
  _.each(_.rest(router.stack), function(layer) { layer._core = true; });

  return router;
};

_.extend(proto, {
  config: function() {
    if (this.fully_loaded !== true) {
      this.form_builder(this.form_config);

      this.fully_loaded = true;
    }

    return this;
  },

  workspace_files: function() {
    return _.map(this.file_manifest, function(required_file) {
      return path.join(this.dirname, required_file);
    }, this);
  },

  generate_command: function(data) {
    throw new Error("Webserver instances must implement generate_command");
  },

  finish_job: function() {
    throw new Error("Webserver instances must implement finish_job");
  },

  display_results: function(req, res, next) {
    res.sendFile(this.workspace_file(".log"));
  },

  // Any routes that are labeled as core are prioritized below those not labeled core, in the same order
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

  add_tab: function(page_data) {
    // Tabs can provide relative paths to their templates. We need to resolve between the two because the paths are webserver-specific
    page_data.path     = _.flatten([page_data.path]);
    page_data.content  = page_data.content || {};
    var local_pathname = path.join(this.dirname, page_data.template + ".@(jade|html)");
    var results        = glob.sync(local_pathname);

    if (!_.isEmpty(results)) {
      page_data.template = _.first(results);
      this.debug("Found custom tab at %s", page_data.template);
    }

    this.tabs.push(page_data);

    this.get(page_data.path, function(req, res, next) {
      res.render(page_data.template, { page_data: page_data });
    });

    if (_.include(page_data.path, "/submit_job")) {
      this.add_form_submission_route(page_data);
    }
  },

  add_form_submission_route: function(server_page) {
    var router = this;

    this.post(server_page.path, function(req, res, next) {
      router.form.handle(req, {
        success: function(form) {
          if (router.form_is_valid(form)) {
            req.state.warehouse.Job.create_job(req.state.subapp.id, form.data).then(function(job) {
              req.session.submitted_jobs = _.uniq((req.session.submitted_jobs || []).concat(job.nickname));

              res.redirect("jobs/" + job.nickname);
            }).catch(function(err) {
              var error = new Error("Job could not be created");
              res.status(error.status = 500);

              next(error);
            });
          } else {
            var errors = _.chain(form.fields).pluck("error").compact().inject(function(array, errors) {
              Array.prototype.push.apply(array, errors);
              return array;
            }, []).value();

            req.flash("form_error", errors);

            res.render(server_page.template, { page_data: server_page, previous_form: form });
          }
        },
        other: function(form) {
          res.render(server_page.template, { page_data: server_page, previous_form: form });
        }
      });
    });
  }
});
