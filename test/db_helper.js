"use strict";

var test_helper = require("./test_helper");
var config      = require("config");
var db_uri      = config.get("db_uri");
var warehouse   = require("../lib/warehouse")({ db_uri: db_uri });
var pbs         = require("../lib/daemons/pbs");
var daemon      = require("../lib/daemon")(warehouse, pbs);
module.exports  = test_helper;


_.extend(test_helper, {
  db_uri: db_uri,

  warehouse: warehouse,

  daemon: daemon,

  clear_db: function() {
    _.each(this.warehouse.connection.collections, function(collection) {
      collection.remove(_.identity);
    });
  }
});

_.extend(test_helper.__proto__, {
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
});
