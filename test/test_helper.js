"use strict";

global._          = require("underscore");
global.basedir    = process.cwd();
var chai          = require("chai");
var chai_promises = require("chai-as-promised");
var pbs           = require("../lib/daemons/pbs");
var daemon        = require("../lib/daemon")(pbs);

process.env.NODE_ENV = "test";
chai.should();
chai.use(chai_promises);

var test_helper = module.exports = {
  daemon: daemon
};

test_helper.__proto__ = {};
