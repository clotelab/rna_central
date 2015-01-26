var __        = require("underscore");
var db_uri    = "mongodb://localhost/rna_central_test";
var should    = require("should");
var sinon     = require("sinon");
var clear_db  = require("mocha-mongoose")(db_uri);
var warehouse = require("../core/warehouse.js")({
  db_uri: db_uri,
  db_error: __.identity
});

describe("Warehouse", function() {
  before("connect to the DB", function(done) {
    if (warehouse.connection.db) return done();

    warehouse.connect(db_uri, done);
  });
  
  before("stub out Date.now", function() {
    this.user_created_at_default = sinon.stub(warehouse.User.schema.paths.created_at, "defaultValue", function() {
      return new Date(0);
    });
  });
  
  after("restore Date.now", function() {
    this.user_created_at_default.restore();
  });

  it("should connect to the test DB", function() {
    warehouse.connection.db.databaseName.should.equal("rna_central_test");
  });

  describe("User", function() {
    afterEach("ensure DB is empty", function(done) {
      clear_db(function(err) {
        if (err) return done(err);
        
        warehouse.User.find({}, function(err, users) {
          if (err) return done(err);
          users.length.should.equal(0);
          done();
        });
      });
    });
    
    it("should save with valid data", function(done) {
      var user = new warehouse.User({ email: "test@example.com" });
      user.save(done);
    });
    
    it("should set the created_at time", function(done) {
      var user = new warehouse.User({ email: "test@example.com" });
      user.save(function(err) {
        if (err) return done(err);
        user.created_at.should.eql(new Date(0));
        done();
      });
    });
    
    describe("email", function() {
      it("is required", function(done) {
        var user = new warehouse.User({});
        user.save(function(err) {
          err.should.have.propertyByPath("errors", "email", "kind").and.equal("required");
          done();
        });
      });
    
      it("must be valid", function(done) {
        var user = new warehouse.User({ email: "corgi" });
        user.save(function(err) {
          err.should.have.propertyByPath("errors", "email", "message").and.equal("corgi is not a valid email address");
          done();
        });
      });  
    
      it("should clean up nicely", function(done) {
        var user = new warehouse.User({ email: " TEST@example.com " });
        user.save(function(err, user) {
          user.email.should.equal("test@example.com");
          done();
        });
      });
    
      it("should enforce uniqueness", function(done) {
        var user_1 = new warehouse.User({ email: "test@example.com" });
        user_1.save(function(err) {
          if (err) return done(err);

          var user_2 = new warehouse.User({ email: " TEST@example.com " });
          user_2.save(function(err) {
            err.code.should.equal(11000);
            done();
          });
        });
      });
    });
  });
});
