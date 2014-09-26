#!/usr/bin/env node
'use strict';

var replit    = require("repl-it");
var highlight = require("ansi-highlight");

var repl = module.exports = function() {
  global.s = {
    "ap": function(object) {
      console.log(typeof(object) === "function" ? highlight(object.toString()) : object);
    }
  };
  
  replit();
}

if (!module.parent) {
  repl();
}
