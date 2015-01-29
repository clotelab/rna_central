"use strict";

var __          = require("underscore");
var BPromise    = require("bluebird");
var should      = require("should");
var test_helper = require("../warehouse_helper")("mongodb://localhost/rna_central_test");

describe("Run model", function() {
  test_helper.stub_date_for.call(this, test_helper.warehouse.models.Run.schema.paths.created_at, "defaultValue");
  
  describe("DB operations", function() {
    test_helper.ensure_test_db_used.call(this, test_helper);
    
    it("should save with valid data", function(done) {
      var run = new test_helper.warehouse.models.Run({ name: "Corgi" });
      run.save(done);
    });
    
    it("can save as active", function(done) {
      new test_helper.warehouse.models.Run({ name: "Corgi", active: true }).saveAsync().spread(function(run, count) {
        run.active.should.eql(true);
      }).then(done).catch(done);
    });
    
    it("should set the created_at time", function(done) {
      new test_helper.warehouse.models.Run({ name: "Corgi" }).saveAsync().spread(function(run, count) {
        run.created_at.should.eql(new Date(0));
      }).then(done).catch(done);
    });
    
    it("should be disabled by default", function(done) {
      new test_helper.warehouse.models.Run({ name: "Corgi" }).saveAsync().spread(function(run, count) {
        run.active.should.eql(false);
      }).then(done).catch(done);
    });
    
    describe("name", function() {
      it("is required", function(done) {
        new test_helper.warehouse.models.Run({}).saveAsync().catch(function(err) {
          err.should.have.propertyByPath("errors", "name", "type").and.equal("required");
        }).then(done).catch(done);
      }); 
    
      it("should clean up nicely", function(done) {
        new test_helper.warehouse.models.Run({ name: " Corgi " }).saveAsync().spread(function(run) {
          run.name.should.equal("Corgi");
        }).then(done).catch(done);
      });
    
      it("should enforce uniqueness", function(done) {
        new test_helper.warehouse.models.Run({ name: "Corgi" }).saveAsync().then(function() {
          return new test_helper.warehouse.models.Run({ name: "Corgi" }).saveAsync();
        }).catch(function(err) {
          err.code.should.equal(11000);
        }).then(done).catch(done);
      });
      
      it("has case-sensitive uniqueness", function(done) {
        new test_helper.warehouse.models.Run({ name: "Corgi" }).saveAsync().then(function() {
          return new test_helper.warehouse.models.Run({ name: "corgi" }).save(done);
        });
      });
    });
  });
});
