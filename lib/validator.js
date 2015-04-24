"use strict";

var validator = require("validator");

validator.extend("is_rna", function(string) {
	return /^[augc]+$/i.test(string);
});

module.exports = validator;
