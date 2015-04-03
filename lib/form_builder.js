"use strict";

var debug = require("debug")("rna_central:form_builder");
var forms = require("forms");

var proto = module.exports = function(webserver) {
  
  
  // This function generates a new form_builder object which is attached to the subapp built in subapp.js
  // It's done in this fashion because when the returned function is invoked, the resulting form that was
  // generated is saved to the form_builder object, so we need to subvert node.js module caching
  function form_builder(config_function) {
    _.bind(function() {
      this.form = this.create(
        config_function.call(this, this.fields, this.validators, this.widgets), 
        { validatePastFirstError: true }
      );
    }, form_builder)();
  }

  form_builder.__proto__           = proto;
  proto.__proto__                  = forms;
  proto.fields.__proto__           = forms.fields;
  proto.validators.__proto__       = forms.validators;
  proto.widgets.__proto__          = forms.widgets;
  
  _.extend(webserver.__proto__, {
    form_builder: form_builder,
    
    form_validator: function(validate_form) {
      this.validate_form = validate_form;
    },
  
    validate_form: function(form) {
      throw new Error("Webserver instances must implement form_validator");
    },
    
    add_form_submission_route: function(server_tab) {
      var router = this;
    
      router.post(server_tab.path, function(req, res, next) {
        router.form_builder.form.handle(req, {
          success: function(form) {
            if (router.validate_form(form.data) {
              res.json(req.body);
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

_.extend(proto, {
  debug: debug,
  
  generate_html: function(form) {
    return (form || this.form).toHTML();
  },
  
  fields: {},
  
  validators: {},
  
  widgets: {}
});
