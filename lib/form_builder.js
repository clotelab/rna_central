"use strict";

var debug = require("debug")("rna_central:form_builder");
var forms = require("forms");

var proto = module.exports = function() {
  function form_builder(config_function) {
    _.bind(function() {
      this.form = this.create(
        config_function.call(this, this.fields, this.validators), 
        { validatePastFirstError: true }
      );
    }, form_builder)();
  }

  form_builder.__proto__     = proto;
  proto.__proto__            = forms;
  proto.fields.__proto__     = forms.fields;
  proto.validators.__proto__ = forms.validators;

  return form_builder;
};

_.extend(proto, {
  debug: debug,
  
  generate_html: function(form) {
    return form.toHTML(this.pure_field);
  },
  
  pure_field: function(name, object) {
    var label  = object.labelHTML(name);
    var error  = object.error ? "<div class='alert alert-error'>" + object.error + "</div>" : "";
    var widget = object.widget.toHTML(name, object);
    return "<div class='pure-control-group'>" + label + widget + error + "</div>";
  },
  
  fields: {},
  
  validators: {}
});
