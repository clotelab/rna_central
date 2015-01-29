"use strict";

var __            = require("underscore");
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
  warehouse: require("../core/warehouse.js")({ db_uri: db_uri }),
  clear_db:  BPromise.promisify(require("mocha-mongoose")(db_uri))
};

test_helper.__proto__ = {
  stub_date_for: function(object, key) {
    var key_name = "_" + Date.now().toString() + key + __.uniqueId().toString();
    
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
    afterEach("ensure DB is empty", function(done) {
      test_helper.clear_db().then(function() {
        BPromise.all(__.map(test_helper.warehouse.models, function(model) {
          return model.findAsync({}).then(function(collection) {
            return collection.should.be.empty;
          }).catch(done);
        })).then(function() {
          done();
        });
      });
    });
    
    it("should connect to the test DB", function() {
      test_helper.warehouse.connection.db.databaseName.should.equal(__.last(test_helper.db_uri.split("/")));
    });
  }
};
