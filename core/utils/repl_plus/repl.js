#!/usr/bin/env node
'use strict';

var __        = require("underscore");
var replit    = require("repl-it");
var highlight = require("ansi-highlight");

var repl = exports = module.exports = function() {
  global.__   = __;
  global.repl = {
    "ap": function(object) {
      console.log(_.isFunction(object) ? highlight(object.toString()) : object);
    }
  };
  
  replit();
}

if (!module.parent) {
  repl();
}
