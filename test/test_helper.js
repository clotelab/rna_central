"use strict";

global._          = require("underscore");
global.basedir    = process.cwd();
var chai          = require("chai");
var chai_promises = require("chai-as-promised");

process.env.NODE_ENV = "test";
chai.should();
chai.use(chai_promises);

var test_helper       = module.exports = {};
test_helper.__proto__ = {};
