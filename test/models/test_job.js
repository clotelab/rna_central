"use strict";

var BPromise    = require("bluebird");
var test_helper = require("../db_helper");

describe("Job model", function() {
  test_helper.stub_date_for.call(this, test_helper.warehouse.models.Job.schema.paths.created_at, "defaultValue");
  
  describe("DB operations", function() {
    test_helper.ensure_test_db_used.call(this, test_helper);
    
    var with_saved_user_and_webserver = BPromise.promisify(function(callback) {
      return new test_helper.warehouse.models.User({ email: "test@example.com" }).saveAsync().spread(function(user, count) {
        return new test_helper.warehouse.models.Webserver({ name: "Corgi" }).saveAsync().spread(function(webserver, count) {
          return callback(null, user, webserver);
        });
      });
    });
    
    var build_job = BPromise.promisify(function(config, callback) {
      return with_saved_user_and_webserver().spread(function(user, webserver) {
        return callback(null, new test_helper.warehouse.models.Job(_.extend({
          user: user,
          webserver: webserver
        }, config)));
      });
    });
    
    it("should save with valid data", function() {
      return build_job({}).then(function(job) {
        return job.saveAsync();
      });
    });

    it("should populate associations with save_and_populate", function() {
      return build_job({ nickname: "Chompers" }).then(function(job) {
        return job.save_and_populate();
      }).then(function(job) {
        job.should.have.deep.property("user.email", "test@example.com");
        job.should.have.deep.property("webserver.name", "Corgi");
        job.should.have.property("nickname", "Chompers");
      });
    });
    
    describe("state", function() {
      it("should be unqueued by default", function() {
        return build_job({}).then(function(job) {
          return job.saveAsync().should.eventually.have.deep.property("[0].state", "unqueued");
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
            
            return new test_helper.warehouse.models.Job(config)
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

            return new test_helper.warehouse.models.Job(config)
              .save_and_populate().should.eventually.be.rejected.and.have.deep.property("errors.state.type", "enum");
          });
        });
      });
    });
    
    describe("queue_id", function() {
      it("is empty by default", function() {
        return build_job({}).then(function(job) {
          return job.save_and_populate().tap(console.log).should.eventually.have.deep.property("queue_id", "unqueued");
        });
      });
    });

    describe("data", function() {
      it("should instantiate unique objects by default", function() {
        return with_saved_user_and_webserver().spread(function(user, webserver) {
          return new test_helper.warehouse.models.Job({
            user: user,
            webserver: webserver
          }).saveAsync().spread(function(job_1, count) {
            return new test_helper.warehouse.models.Job({
              user: user,
              webserver: webserver
            }).saveAsync().should.eventually.have.deep.property("[0]").and.not.equal(job_1.data);
          });
        });
      });
    });
  });
});
