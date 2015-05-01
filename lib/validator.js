"use strict";

var debug     = require("debug")("rna_central:validator");
var mustache  = require("mustache");
var validator = require("validator");

// This is an example of a simple validator, to make sure that the string is a valid RNA sequence (case-insensitive)
validator.extend("is_rna", function(string) {
	return /^[augc]+$/i.test(string);
});

// Function to flag the form element "key" as having an invalid entry "value" when tested against the validation
// named "validator". This populates an error key on the corresponding form field with the user-specified "message"
// (or a default), which gets picked up by the caolan/forms library to flag the whole form invalid.
var mark_invalid = function(validator, form, key, value, message) {
	var error_message;

	debug("The validation %s failed against '%s'", validator, value);

	if (_.isString(message)) {
		error_message = mustache.render(message, { value: value });
	} else {
		error_message = "The value provided is invalid";
	}

	form.fields[key].error = error_message;
};

// Used to wrap the functions declared in the validator library. We want to wrap them so that after validation,
// if the value was invalid we automatically flag the corresponding field as invalid in the form and kick it
// back to the user. This allows us to create arbitrarily complex validation that has a simple front-end and
// is pre-wired.
var wrap_validation_function = function(form) {
	return function(memo, function_name) {
  	memo[function_name] = function(options) {
  		debug("Calling validator %s for key %s", function_name, options.key);

  		var args  = _.toArray(arguments).slice(1);
  		var value = form.data[options.key];
  		args.unshift(value);

			var valid = validator[function_name].apply(validator, args);

			if (!valid) {
				mark_invalid(function_name, form, options.key, value, options.message);
				form.error_count += 1;
			}

			return valid;
  	};

  	return memo;
  };
};

module.exports = function(form) {
	form.error_count     = 0;
  var scoped_validator = _.chain(validator)
  												.functions()
  												.inject(wrap_validation_function(form), function() {
  													return form.error_count === 0;
  												})
  												.value();

	return function(validation_function) {
		validation_function.call(form, scoped_validator);

		return scoped_validator();
	};
};
