"use strict";

var FormRenderer = module.exports = function(form) {
	if (!(this instanceof FormRenderer)) {
		return new FormRenderer(form);
	}

	this.form = form;
};

FormRenderer.prototype.to_html = function() {
	// return this.form.toHTML(this.pure_field);
	return this.form.toHTML();
};

FormRenderer.prototype.pure_field = function(name, object) {
	object.widget.classes = object.widget.classes || [];
  object.widget.classes.push("form-control");

  var label = object.labelHTML(name);
  var error = object.error ? "<div class='alert alert-error help-block'>" + object.error + "</div>" : "";

  var validationclass = object.value && !object.error ? "has-success" : "";
  validationclass = object.error ? "has-error" : validationclass;

  var widget = object.widget.toHTML(name, object);
  return "<div class='form-group " + validationclass + "'>" + label + widget + error + "</div>";
};
