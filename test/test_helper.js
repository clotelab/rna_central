"use strict";

global._          = require("underscore");
var BPromise      = require("bluebird");
var sinon         = require("sinon");
var chai          = require("chai");
var chai_promises = require("chai-as-promised");
var db_uri        = "mongodb://localhost/rna_central_test";

process.env.NODE_ENV = "test";
chai.should();
chai.use(chai_promises);

var test_helper = module.exports = {
  db_uri: db_uri,
  warehouse: require("../lib/warehouse.js")({ db_uri: db_uri }),
  clear_db: function() {
    _.each(this.warehouse.connection.collections, function(collection) {
      collection.remove(_.identity);
    });
  }
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
  },
  
  ensure_test_db_used: function(test_helper) {
    beforeEach("connect to test DB", function() {
      if (test_helper.warehouse.connection.readyState === 0) {
        test_helper.warehouse.connect(test_helper.db_uri);
      }
    });
    
    afterEach("clear test DB", function() {
      test_helper.clear_db();
    });
    
    it("should connect to the test DB", function() {
      test_helper.warehouse.connection.db.databaseName.should.equal(_.last(test_helper.db_uri.split("/")));
    });
  }
};
