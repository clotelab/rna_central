"use strict";

var _          = require("underscore");
var prettyjson = require("prettyjson");

module.exports = function(object) {
	console.log(prettyjson.render(object));
};
