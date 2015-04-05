"use strict";

var path       = require("path");
global._       = require("underscore");
global.basedir = path.join(__dirname, "../..");
var bluebird   = require("bluebird");
var pbs        = require("../daemons/pbs");
var daemon     = require("../daemon")(pbs);
var warehouse  = require("../warehouse")({});

process.env.NODE_ENV = "test";

warehouse.Job.remove().execAsync().then(function() {
  return warehouse.Job({ email: "evansenter@gmail.com", webserver_name: "example" }).saveAsync();
}).catch(console.log.bind(console));
