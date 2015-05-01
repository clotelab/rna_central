"use strict";

require("../lib/globals");

process.env.NODE_ENV        = "test";
var chai                    = require("chai");
var chai_promises           = require("chai-as-promised");

chai.should();
chai.use(chai_promises);

var test_helper       = module.exports = {};
test_helper.__proto__ = {};
