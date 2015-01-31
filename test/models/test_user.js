"use strict";

var __          = require("underscore");
var test_helper = require("../test_helper");

describe("User model", function() {
  test_helper.stub_date_for.call(this, test_helper.warehouse.models.User.schema.paths.created_at, "defaultValue");

  describe("DB operations", function() {
    test_helper.ensure_test_db_used.call(this, test_helper);
    
    it("should save with valid data", function() {
      return new test_helper.warehouse.models.User({ email: "test@example.com" }).save();
    });
    
    it("should set the created_at time", function() {
      return new test_helper.warehouse.models.User({ email: "test@example.com" })
        .saveAsync().should.eventually.have.deep.property("[0].created_at").eql(new Date(0));
    });
    
    describe("email", function() {
      it("is required", function() {
        return new test_helper.warehouse.models.User({})
          .saveAsync().should.eventually.be.rejected.and.have.deep.property("errors.email.type", "required");
      });
    
      it("must be valid", function() {
        return new test_helper.warehouse.models.User({ email: "corgi" })
          .saveAsync().should.eventually.be.rejected.and.have.deep.property("errors.email.message", "corgi is not a valid email address");
      });  
    
      it("should clean up nicely", function() {
        return new test_helper.warehouse.models.User({ email: " TEST@example.com " })
          .saveAsync().should.eventually.have.deep.property("[0].email", "test@example.com");
      });
    
      it("should enforce uniqueness", function() {
        return new test_helper.warehouse.models.User({ email: "test@example.com" }).saveAsync().then(function() {
          return new test_helper.warehouse.models.User({ email: "test@example.com" })
            .saveAsync().should.eventually.be.rejected.and.have.property("code", 11000);
        });
      });
    });
  });
});
