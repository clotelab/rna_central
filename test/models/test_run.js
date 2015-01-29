"use strict";

var __          = require("underscore");
var test_helper = require("../test_helper");

describe("Run model", function() {
  test_helper.stub_date_for.call(this, test_helper.warehouse.models.Run.schema.paths.created_at, "defaultValue");
  
  describe("DB operations", function() {
    test_helper.ensure_test_db_used.call(this, test_helper);
    
    var with_saved_user_and_webserver = function(config, callback) {
      if (__.isFunction(config)) {
        callback = config;
        config   = {
          user: { email: "test@example.com" },
          webserver: { name: "Corgi" }
        };
      }
      
      return new test_helper.warehouse.models.User(config.user).saveAsync().spread(function(user, count) {
        return new test_helper.warehouse.models.Webserver(config.webserver).saveAsync().spread(function(webserver, count) {
          return callback(user, webserver);
        });
      });
    };

    it("should save with valid data", function() {
      return with_saved_user_and_webserver(function(user, webserver) {
        return new test_helper.warehouse.models.Run({
          name: "Corgi",
          user: user,
          webserver: webserver
        }).save();
      });
    });
    
    it("rebuild associations correctly", function() {
      return with_saved_user_and_webserver({
        user: { email: "pony@stable.com" },
        webserver: { name: "Budweiser" }
      }, function(user, webserver) {
        return new test_helper.warehouse.models.Run({ 
          nickname: "Hay",
          user: user,
          webserver: webserver
        }).saveAsync().spread(function(run, count) {
          return test_helper.warehouse.models.Run.populateAsync(run, "user webserver".split(" ")).then(function(populated_run) {
            populated_run.should.have.deep.property("user.email", "pony@stable.com");
            populated_run.should.have.deep.property("webserver.name", "Budweiser");
            populated_run.should.have.property("nickname", "Hay");
          });
        });
      });
    });
    //
    // it("can save as active", function() {
    //   return new test_helper.warehouse.models.Run({ name: "Corgi", active: true })
    //     .saveAsync().should.eventually.have.deep.property("[0].active");
    // });
    //
    // it("should set the created_at time", function() {
    //   return new test_helper.warehouse.models.Run({ name: "Corgi" })
    //     .saveAsync().should.eventually.have.deep.property("[0].created_at").eql(new Date(0));
    // });
    //
    // it("should be disabled by default", function() {
    //   return new test_helper.warehouse.models.Run({ name: "Corgi" })
    //     .saveAsync().should.eventually.have.deep.property("[0].active", false);
    // });
    //
    // describe("name", function() {
    //   it("is required", function() {
    //     return new test_helper.warehouse.models.Run({})
    //       .saveAsync().should.be.rejected.and.should.eventually.have.deep.property("errors.name.type", "required");
    //   });
    //
    //   it("should clean up nicely", function() {
    //     new test_helper.warehouse.models.Run({ name: " Corgi " })
    //       .saveAsync().should.eventually.have.deep.property("[0].name", "Corgi");
    //   });
    //
    //   it("should enforce uniqueness", function() {
    //     return new test_helper.warehouse.models.Run({ name: "Corgi" }).saveAsync().then(function() {
    //       return new test_helper.warehouse.models.Run({ name: "Corgi" })
    //         .saveAsync().should.be.rejected.and.should.eventually.have.property("code", 11000);
    //     });
    //   });
    //
    //   it("has case-sensitive uniqueness", function() {
    //     return new test_helper.warehouse.models.Run({ name: "Corgi" }).saveAsync().then(function() {
    //       return new test_helper.warehouse.models.Run({ name: "corgi" }).saveAsync();
    //     });
    //   });
    // });
  });
});
