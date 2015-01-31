"use strict";

var __          = require("underscore");
var test_helper = require("../test_helper");

describe("Webserver model", function() {
  test_helper.stub_date_for.call(this, test_helper.warehouse.models.Webserver.schema.paths.created_at, "defaultValue");
  
  describe("DB operations", function() {
    test_helper.ensure_test_db_used.call(this, test_helper);
    
    it("should save with valid data", function() {
      return new test_helper.warehouse.models.Webserver({ name: "Corgi" }).save();
    });
    
    it("can save as active", function() {
      return new test_helper.warehouse.models.Webserver({ name: "Corgi", active: true })
        .saveAsync().should.eventually.have.deep.property("[0].active");
    });
    
    it("should set the created_at time", function() {
      return new test_helper.warehouse.models.Webserver({ name: "Corgi" })
        .saveAsync().should.eventually.have.deep.property("[0].created_at").eql(new Date(0));
    });
    
    it("should be disabled by default", function() {
      return new test_helper.warehouse.models.Webserver({ name: "Corgi" })
        .saveAsync().should.eventually.have.deep.property("[0].active", false);
    });
    
    describe("name", function() {
      it("is required", function() {
        return new test_helper.warehouse.models.Webserver({})
          .saveAsync().should.eventually.be.rejected.and.have.deep.property("errors.name.type", "required");
      }); 
    
      it("should clean up nicely", function() {
        new test_helper.warehouse.models.Webserver({ name: " Corgi " })
          .saveAsync().should.eventually.have.deep.property("[0].name", "Corgi");
      });
    
      it("should enforce uniqueness", function() {
        return new test_helper.warehouse.models.Webserver({ name: "Corgi" }).saveAsync().then(function() {
          return new test_helper.warehouse.models.Webserver({ name: "Corgi" })
            .saveAsync().should.eventually.be.rejected.and.have.property("code", 11000);
        });
      });
      
      it("has case-sensitive uniqueness", function() {
        return new test_helper.warehouse.models.Webserver({ name: "Corgi" }).saveAsync().then(function() {
          return new test_helper.warehouse.models.Webserver({ name: "corgi" }).saveAsync();
        });
      });
    });
  });
});
