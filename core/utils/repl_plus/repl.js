#!/usr/bin/env node
"use strict";

var __        = require("underscore");
var fs        = require("fs");
var path      = require("path");
var replit    = require("repl-it");
var highlight = require("ansi-highlight");

try {
  var ignoreList = JSON.parse(fs.readFileSync(path.join(__dirname, "ignore.json")));
} catch (error) {
  console.log(error);
  process.exit(1);
}

replit.prototype.loadPackages = __.wrap(replit.prototype.loadPackages, function(loadPackages) {
  var args = __.toArray(arguments).slice(1);
  args.splice(1, 0, __.difference(args.splice(1, 1)[0], ignoreList));
  
  try {
    loadPackages.apply(this, args);
  } catch (error) {
    console.log(error);
  }
});

var repl = module.exports = function() {
  global.__   = __;
  global.repl = {
    "ap": function(object) {
      console.log(__.isFunction(object) ? highlight(object.toString()) : object);
    }
  };
  
  replit();
};

if (!module.parent) {
  repl();
}
