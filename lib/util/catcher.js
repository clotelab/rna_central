"use strict";

var colors = require("colors/safe");

module.exports = function(err) {
  console.log(colors.red(err.stack || err.message));

  throw err;
};
