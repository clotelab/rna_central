"use strict";

var debug         = require("debug")("rna_central:form_builder");
var forms         = require("forms");
var validator     = require("./validator");
var form_renderer = require("./form_renderer");
var warehouse     = require("./warehouse");

var proto = module.exports = function(webserver) {
  // This function generates a new form_builder object which is attached to the subapp built in subapp.js
  // It's done in this fashion because when the returned function is invoked, the resulting form that was
  // generated is saved to the form_builder object, so we need to subvert node.js module caching
  function form_builder(form_config) {
    webserver.form = form_builder.create(
      form_config.call(form_builder, form_builder.fields, form_builder.widgets),
      { validatePastFirstError: true }
    );

    webserver.form.__proto__ = form_renderer;
  }

  form_builder.__proto__ = forms;

  _.extend(webserver.__proto__, {
    form_builder: form_builder,

    form_validator: function(form) {
      throw new Error("Webserver instances must implement form_validator");
    },

    form_is_valid: function(form) {
      var scoped_validator = validator(form);

      this.form_validator.call(form, form.data, scoped_validator);

      return form.error_count === 0;
    },

    // Move this into subapp.js
    add_form_submission_route: function(server_tab) {
      var router = this;

      router.post(server_tab.path, function(req, res, next) {
        router.form.handle(req, {
          success: function(form) {
            if (router.form_is_valid(form)) {
              warehouse.Job.create_job(req.state.subapp.id, form.data).then(function(job) {
                req.session.submitted_jobs = _.uniq((req.session.submitted_jobs || []).concat(job.nickname));

                res.redirect("jobs/" + job.nickname);
              }).catch(function() {
                res.json(req.body);
              });
            } else {
              res.render(server_tab.template, { current_tab: server_tab, previous_form: form });
            }
          },
          other: function(form) {
            res.render(server_tab.template, { current_tab: server_tab, previous_form: form });
          }
        });
      });
    }
  });
};
