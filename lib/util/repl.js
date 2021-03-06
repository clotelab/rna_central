"use strict";

var repl        = require("repl");
var _           = require("underscore");
var rna_central = require("../app");
var app         = rna_central.app;
var db          = require("../db");
var repl_server = module.exports = repl.start({
  prompt: "rna_central (" + app.get("env") + ") > ",
});

repl_server.context.__  = _;
repl_server.context.app = app;
repl_server.context.db  = db.config({});
