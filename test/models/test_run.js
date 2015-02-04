"use strict";

var __          = require("underscore");
var BPromise    = require("bluebird");
var test_helper = require("../test_helper");

describe("Run model", function() {
  test_helper.stub_date_for.call(this, test_helper.warehouse.models.Run.schema.paths.created_at, "defaultValue");
  
  describe("DB operations", function() {
    test_helper.ensure_test_db_used.call(this, test_helper);
    
    var with_saved_user_and_webserver = BPromise.promisify(function(callback) {
      return new test_helper.warehouse.models.User({ email: "test@example.com" }).saveAsync().spread(function(user, count) {
        return new test_helper.warehouse.models.Webserver({ name: "Corgi" }).saveAsync().spread(function(webserver, count) {
          return callback(null, user, webserver);
        });
      });
    });
    
    var build_run = BPromise.promisify(function(config, callback) {
      return with_saved_user_and_webserver().spread(function(user, webserver) {
        return callback(null, new test_helper.warehouse.models.Run(__.extend({
          user: user,
          webserver: webserver
        }, config)));
      });
    });
    
    it("should save with valid data", function() {
      return build_run({}).then(function(run) {
        return run.saveAsync();
      });
    });

    it("should populate associations with save_and_populate", function() {
      return build_run({ nickname: "Chompers" }).then(function(run) {
        return run.save_and_populate();
      }).then(function(run) {
        run.should.have.deep.property("user.email", "test@example.com");
        run.should.have.deep.property("webserver.name", "Corgi");
        run.should.have.property("nickname", "Chompers");
      });
    });
    
    describe("state", function() {
      it("should be unqueued by default", function() {
        return build_run({}).then(function(run) {
          return run.saveAsync().should.eventually.have.deep.property("[0].state", "unqueued");
        });
      });
      
      it("should be valid only with acceptable enum string", function() {
        return with_saved_user_and_webserver().spread(function(user, webserver) {
          return BPromise.map("unqueued queued running complete error".split(" "), function(state) {
            var config = {
              user: user,
              webserver: webserver,
              state: state
            };
            
            return new test_helper.warehouse.models.Run(config)
              .save_and_populate().should.eventually.have.property("state", state);
          });
        });
      });
      
      it("should be invalid with anything else", function() {
        return with_saved_user_and_webserver().spread(function(user, webserver) {
          return BPromise.map("unqueued queued running complete error".split(" "), function(state) {
            var config = {
              user: user,
              webserver: webserver,
              state: state + "o'corgi"
            };

            return new test_helper.warehouse.models.Run(config)
              .save_and_populate().should.eventually.be.rejected.and.have.deep.property("errors.state.type", "enum");
          });
        });
      });
    });
    
    // describe("job_id", function() {
    //   it("is required", function() {
    //     return new test_helper.warehouse.models.Run({})
    //       .saveAsync().should.eventually.be.rejected.and.have.deep.property("errors.job_id.type", "required");
    //   });
    //
    //   it("should enforce uniqueness", function() {
    //     return build_run({ job_id: __.uniqueId().toString() }, function(run) {
    //       return run.save_and_populate().then(function(deep_run) {
    //         return new test_helper.warehouse.models.Run({
    //           user: deep_run.user,
    //           webserver: deep_run.webserver,
    //           job_id: deep_run.job_id
    //         }).saveAsync().should.eventually.be.rejected.and.have.property("code", 11000);
    //       });
    //     });
    //   });
    // });

    describe("data", function() {
      it("should instantiate unique objects by default", function() {
        return with_saved_user_and_webserver().spread(function(user, webserver) {
          return new test_helper.warehouse.models.Run({
            user: user,
            webserver: webserver
          }).saveAsync().spread(function(run_1, count) {
            return new test_helper.warehouse.models.Run({
              user: user,
              webserver: webserver
            }).saveAsync().should.eventually.have.deep.property("[0]").and.not.equal(run_1.data);
          });
        });
      });
    });
  });
});
