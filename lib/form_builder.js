"use strict";

var debug     = require("debug")("rna_central:form_builder");
var forms     = require("forms");
var validator = require("./validator");

module.exports = function(webserver) {
  // This function generates a new form_builder object which is attached to the subapp built in subapp.js
  // It's done in this fashion because when the returned function is invoked, the resulting form that was
  // generated is saved to the form_builder object, so we need to subvert node.js module caching
  function form_builder(form_config) {
    webserver.form = form_builder.create(
      form_config.call(form_builder, form_builder.fields, form_builder.widgets),
      { validatePastFirstError: true }
    );
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
    }
  });
};
