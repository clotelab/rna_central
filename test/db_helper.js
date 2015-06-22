"use strict";

var test_helper = require("./test_helper");
var config      = require("config");
var db_uri      = config.get("db_uri");
var db          = require("../lib/db");
var pbs         = require("../lib/daemons/pbs");
var daemon      = require("../lib/daemon");
module.exports  = test_helper;

db.config({ db_uri: db_uri });
daemon.config(db, pbs);

_.extend(test_helper, {
  db: db,

  db_uri: db_uri,

  daemon: daemon,

  clear_db: function() {
    _.each(this.db.connection.collections, function(collection) {
      collection.remove(_.identity);
    });
  }
});

_.extend(test_helper.__proto__, {
  ensure_test_db_used: function(test_helper) {
    beforeEach("connect to test DB", function() {
      if (test_helper.db.connection.readyState === 0) {
        test_helper.db.connect(test_helper.db_uri);
      }
    });

    afterEach("clear test DB", function() {
      test_helper.clear_db();
    });

    it("should connect to the test DB", function() {
      test_helper.db.connection.db.databaseName.should.equal(_.last(test_helper.db_uri.split("/")));
    });
  }
});
