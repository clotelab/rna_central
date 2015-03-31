"use strict";

global._          = require("underscore");
global.basedir    = process.cwd();
var sinon         = require("sinon");
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

test_helper.__proto__ = {
  stub_date_for: function(object, key) {
    var key_name = "_" + Date.now().toString() + key + _.uniqueId().toString();
    
    before("stub out Date.now", function() {
      this[key_name] = sinon.stub(object, key, function() {
        return new Date(0);
      });
    });

    after("restore Date.now", function() {
      this[key_name].restore();
    });
  }
};
