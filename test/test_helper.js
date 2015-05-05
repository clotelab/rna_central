"use strict";

require("../lib/globals");

process.env.NODE_ENV = "test";
var chai             = require("chai");
var chai_promises    = require("chai-as-promised");
var stub_transport   = require("nodemailer-stub-transport");
var mailer           = require("../lib/mailer").config(stub_transport());

chai.should();
chai.use(chai_promises);

var test_helper       = module.exports = {};
test_helper.__proto__ = {};
