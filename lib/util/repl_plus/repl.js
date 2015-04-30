#!/usr/bin/env node
"use strict";

var _         = require("underscore");
var fs        = require("fs");
var path      = require("path");
var replit    = require("repl-it");
var highlight = require("ansi-highlight");

try {
  var ignoreList = JSON.parse(fs.readFileSync(path.join(__dirname, "ignore.json")));
} catch (err) {
  console.log(err);
  process.exit(1);
}

replit.prototype.loadPackages = _.wrap(replit.prototype.loadPackages, function(loadPackages) {
  var args = _.toArray(arguments).slice(1);
  args.splice(1, 0, _.difference(args.splice(1, 1)[0], ignoreList));

  try {
    loadPackages.apply(this, args);
  } catch (error) {
    console.log(error);
  }
});

var repl = module.exports = function() {
  global.__   = global._ = _;
  global.repl = {
    "ap": function(object) {
      console.log(_.isFunction(object) ? highlight(object.toString()) : object);
    }
  };

  require("../../globals");

  global.pbs       = require(path.join(global.basedir, "lib/daemons/pbs"));
  global.daemon    = require(path.join(global.basedir, "lib/daemon"))(global.pbs);
  global.warehouse = require(path.join(global.basedir, "lib/warehouse"))({});

  replit();
};

if (!module.parent) {
  repl();
}
