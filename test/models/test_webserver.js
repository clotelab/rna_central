"use strict";

var __          = require("underscore");
var BPromise    = require("bluebird");
var should      = require("should");
var test_helper = require("../warehouse_helper")("mongodb://localhost/rna_central_test");

describe("Webserver model", function() {
  test_helper.stub_date_for.call(this, test_helper.warehouse.models.Webserver.schema.paths.created_at, "defaultValue");
  
  describe("DB operations", function() {
    test_helper.ensure_test_db_used.call(this, test_helper);
    
    it("should save with valid data", function(done) {
      var webserver = new test_helper.warehouse.models.Webserver({ name: "Corgi" });
      webserver.save(done);
    });
    
    it("can save as active", function(done) {
      new test_helper.warehouse.models.Webserver({ name: "Corgi", active: true }).saveAsync().spread(function(webserver, count) {
        webserver.active.should.eql(true);
      }).then(done).catch(done);
    });
    
    it("should set the created_at time", function(done) {
      new test_helper.warehouse.models.Webserver({ name: "Corgi" }).saveAsync().spread(function(webserver, count) {
        webserver.created_at.should.eql(new Date(0));
      }).then(done).catch(done);
    });
    
    it("should be disabled by default", function(done) {
      new test_helper.warehouse.models.Webserver({ name: "Corgi" }).saveAsync().spread(function(webserver, count) {
        webserver.active.should.eql(false);
      }).then(done).catch(done);
    });
    
    describe("name", function() {
      it("is required", function(done) {
        new test_helper.warehouse.models.Webserver({}).saveAsync().catch(function(err) {
          err.should.have.propertyByPath("errors", "name", "type").and.equal("required");
        }).then(done).catch(done);
      }); 
    
      it("should clean up nicely", function(done) {
        new test_helper.warehouse.models.Webserver({ name: " Corgi " }).saveAsync().spread(function(webserver) {
          webserver.name.should.equal("Corgi");
        }).then(done).catch(done);
      });
    
      it("should enforce uniqueness", function(done) {
        new test_helper.warehouse.models.Webserver({ name: "Corgi" }).saveAsync().then(function() {
          return new test_helper.warehouse.models.Webserver({ name: "Corgi" }).saveAsync();
        }).catch(function(err) {
          err.code.should.equal(11000);
        }).then(done).catch(done);
      });
      
      it("has case-sensitive uniqueness", function(done) {
        new test_helper.warehouse.models.Webserver({ name: "Corgi" }).saveAsync().then(function() {
          return new test_helper.warehouse.models.Webserver({ name: "corgi" }).save(done);
        });
      });
    });
  });
});
