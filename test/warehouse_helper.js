var __       = require("underscore");
var BPromise = require("bluebird");
var sinon    = require("sinon");

var proto = module.exports = function(db_uri) {
  var test_helper = {
    db_uri: db_uri,
    warehouse: require("../core/warehouse.js")({ db_uri: db_uri }),
    clear_db:  BPromise.promisify(require("mocha-mongoose")(db_uri))
  }
  
  test_helper.__proto__ = proto;
  
  return test_helper;
};

__.extend(proto, {
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
            collection.should.be.empty;
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
})
