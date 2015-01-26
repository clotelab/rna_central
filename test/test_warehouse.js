var __        = require("underscore");
var Promise   = require("bluebird");
var should    = require("should");
var sinon     = require("sinon");
var warehouse = require("../core/warehouse.js")({ db_uri: "mongodb://localhost/rna_central_test" });
var clear_db  = Promise.promisify(require("mocha-mongoose")(warehouse.db_uri));

describe("Warehouse", function() {
  before("connect to the DB", function(done) {
    if (warehouse.connection.db) return done();
    warehouse.connect(db_uri, done);
  });
  
  before("stub out Date.now", function() {
    this.user_created_at_default = sinon.stub(warehouse.models.User.schema.paths.created_at, "defaultValue", function() {
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
      clear_db().then(function() {
        return warehouse.models.User.findAsync({});
      }).then(function(users) {
        users.length.should.equal(0);
      }).then(done);
    });
    
    it("should save with valid data", function(done) {
      var user = new warehouse.models.User({ email: "test@example.com" });
      user.save(done);
    });
    
    it("should set the created_at time", function(done) {
      new warehouse.models.User({ email: "test@example.com" }).saveAsync().spread(function(user, count) {
        user.created_at.should.eql(new Date(0));
      }).then(done).catch(done);
    });
    
    describe("email", function() {
      it("is required", function(done) {
        new warehouse.models.User({}).saveAsync().catch(function(err) {
          err.should.have.propertyByPath("errors", "email", "type").and.equal("required");
        }).then(done).catch(done);
      });
    
      it("must be valid", function(done) {
        new warehouse.models.User({ email: "corgi" }).saveAsync().catch(function(err) {
          err.should.have.propertyByPath("errors", "email", "message").and.equal("corgi is not a valid email address");
        }).then(done).catch(done);
      });  
    
      it("should clean up nicely", function(done) {
        new warehouse.models.User({ email: " TEST@example.com " }).saveAsync().spread(function(user) {
          user.email.should.equal("test@example.com");
        }).then(done).catch(done);
      });
    
      it("should enforce uniqueness", function(done) {
        new warehouse.models.User({ email: "test@example.com" }).saveAsync().then(function() {
          return new warehouse.models.User({ email: "test@example.com" }).saveAsync();
        }).catch(function(err) {
          err.code.should.equal(11000);
        }).then(done).catch(done);
      });
    });
  });
});
