var __    = require("underscore");
var debug = require("debug")("rna_central:form_builder");
var forms = require("forms");

var proto = module.exports = function() {
  function form_builder(config_function) {
    __.bind(function() {
      this.form = config_function.call(
        this, 
        this, 
        this.fields, 
        this.validators
      );
    }, form_builder)();
  }

  form_builder.__proto__     = proto;
  proto.__proto__            = forms;
  proto.fields.__proto__     = forms.fields;
  proto.validators.__proto__ = forms.validators;

  return form_builder;
};

__.extend(proto, {
  debug: debug,
  
  generate_html: function() {
    return this.form ? this.form.toHTML(this.pure_field) : "";
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
