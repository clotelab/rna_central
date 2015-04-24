"use strict";

var path                    = require("path");
global._                    = require("underscore");
global.basedir              = process.cwd();
process.env.NODE_CONFIG_DIR = path.join(process.cwd(), "config");
process.env.NODE_ENV        = "test";
var chai                    = require("chai");
var chai_promises           = require("chai-as-promised");

chai.should();
chai.use(chai_promises);

var test_helper       = module.exports = {};
test_helper.__proto__ = {};
