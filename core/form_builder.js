var __    = require("underscore");
var forms = require("forms");
var debug = require("debug")("rna_central:form_builder");

var proto = module.exports = function() {
  function form_builder(config_function) {
    __.bind(function() {
      this.form = config_function.call(this, this, this.fields, this.validators);
    }, form_builder)();
  }

  form_builder.__proto__ = __.extend({}, forms, proto);

  return form_builder;
};

proto.generate_html = function() {
  return this.form ? this.form.toHTML() : "";
}