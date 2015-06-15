"use strict";

var FormRenderer = module.exports = function(form) {
	if (!(this instanceof FormRenderer)) {
		return new FormRenderer(form);
	}

	this.form = form;
};

FormRenderer.prototype.to_html = function() {
	return this.form.toHTML(this.pure_field);
	// return this.form.toHTML();
};

FormRenderer.prototype.pure_field = function(name, object) {
  var label            = object.labelHTML(name);
  var validation_class = object.value && !object.error ? "has-success" : "";
  validation_class     = object.error ? "has-error" : validation_class;

  var widget = object.widget.toHTML(name, object);
  return "<div class='pure-control-group " + validation_class + "'>" + label + widget + "</div>";
};
