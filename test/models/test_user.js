var __          = require("underscore");
var BPromise    = require("bluebird");
var should      = require("should");
var sinon       = require("sinon");
var test_helper = require("../warehouse_helper")("mongodb://localhost/rna_central_test");

describe("test_helper.warehouse", function() {
  before("stub out Date.now", function() {
    this.user_created_at_default = sinon.stub(test_helper.warehouse.models.User.schema.paths.created_at, "defaultValue", function() {
      return new Date(0);
    });
  });
  
  after("restore Date.now", function() {
    this.user_created_at_default.restore();
  });

  it("should connect to the test DB", function() {
    test_helper.warehouse.connection.db.databaseName.should.equal("rna_central_test");
  });

  describe("User", function() {
    afterEach("ensure DB is empty", function(done) {
      test_helper.clear_db().then(function() {
        return test_helper.warehouse.models.User.findAsync({});
      }).then(function(users) {
        users.length.should.equal(0);
      }).then(done);
    });
    
    it("should save with valid data", function(done) {
      var user = new test_helper.warehouse.models.User({ email: "test@example.com" });
      user.save(done);
    });
    
    it("should set the created_at time", function(done) {
      new test_helper.warehouse.models.User({ email: "test@example.com" }).saveAsync().spread(function(user, count) {
        user.created_at.should.eql(new Date(0));
      }).then(done).catch(done);
    });
    
    describe("email", function() {
      it("is required", function(done) {
        new test_helper.warehouse.models.User({}).saveAsync().catch(function(err) {
          err.should.have.propertyByPath("errors", "email", "type").and.equal("required");
        }).then(done).catch(done);
      });
    
      it("must be valid", function(done) {
        new test_helper.warehouse.models.User({ email: "corgi" }).saveAsync().catch(function(err) {
          err.should.have.propertyByPath("errors", "email", "message").and.equal("corgi is not a valid email address");
        }).then(done).catch(done);
      });  
    
      it("should clean up nicely", function(done) {
        new test_helper.warehouse.models.User({ email: " TEST@example.com " }).saveAsync().spread(function(user) {
          user.email.should.equal("test@example.com");
        }).then(done).catch(done);
      });
    
      it("should enforce uniqueness", function(done) {
        new test_helper.warehouse.models.User({ email: "test@example.com" }).saveAsync().then(function() {
          return new test_helper.warehouse.models.User({ email: "test@example.com" }).saveAsync();
        }).catch(function(err) {
          err.code.should.equal(11000);
        }).then(done).catch(done);
      });
    });
  });
});
