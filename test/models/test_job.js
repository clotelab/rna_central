"use strict";

var express     = require("express");
var bluebird    = require("bluebird");
var test_helper = require("../db_helper");
var sinon       = require("sinon");

describe("Job model", function() {
	var Job = test_helper.warehouse.Job;

  var stub_save_hooks = function(job) {
    sinon.stub(job, "submit");
    return job;
  };

  before(function() {
  	sinon.stub(Job.schema.paths.created_at, "defaultValue", function() {
  		return new Date(0);
  	});
  });

  after(function() {
  	Job.schema.paths.created_at.defaultValue.restore();
  });

  describe("database operations", function() {
  	var job;

  	beforeEach(function() {
  		job = new Job({ email: "evansenter@gmail.com", webserver_name: "example" });
      stub_save_hooks(job);
  	});

    test_helper.ensure_test_db_used.call(this, test_helper);

    it("should save with valid data", function() {
      return job.save();
    });

    describe("state", function() {
      it("should be unqueued by default", function() {
        return job.saveAsync().should.eventually.have.deep.property("[0].state", "unqueued");
      });

      it("should be valid only with acceptable enum string", function() {
        return bluebird.map("unqueued queued running complete notified error".split(" "), function(state) {
          return stub_save_hooks(new Job({
            email: "evansenter@gmail.com",
            webserver_name: "example",
            state: state
          })).save();
        });
      });

      it("should be invalid with anything else", function() {
      	return bluebird.map("unqueued queued running complete notified error".split(" "), function(state) {
          return stub_save_hooks(new Job({
            email: "evansenter@gmail.com",
            webserver_name: "example",
            state: state + "o'corgi"
          })).saveAsync().should.eventually.be.rejected.and.have.deep.property("errors.state.kind", "enum");
        });
      });
    });

    describe("with stubbed nickname", function() {
      beforeEach(function() {
        sinon.stub(test_helper.warehouse.Job.schema.statics, "haikunate", function() {
          return "stubbed-haikunate-1234";
        });
      });

      afterEach(function() {
        test_helper.warehouse.Job.schema.statics.haikunate.restore();
      });

      it("is assigned a random string if not provided", function() {
        return job.saveAsync().should.eventually.have.deep.property("[0].nickname", "stubbed-haikunate-1234");
      });

      it("overrides any user-provided name", function() {
        job.nickname = "Corgi";
        return job.saveAsync().should.eventually.have.deep.property("[0].nickname", "stubbed-haikunate-1234");
      });

      describe("virtual workspace_path attribute", function() {
        it("should return the path to the workspace for the job", function() {
          return job.saveAsync()
            .should.eventually.have.deep.property("[0].workspace_path").and.match(/example\/stubbed-haikunate-1234$/);
        });
      });

      describe("virtual job_workspace_file attribute", function() {
        it("should return the path to the file requested, having prefix equal to the job nickname", function() {
          return job.saveAsync().spread(function(job) {
            return job.workspace_file(".sh").should.match(/example\/stubbed-haikunate-1234\/stubbed-haikunate-1234.sh$/);
          });
        });
      });
    });

    describe("queue_id", function() {
      it("is empty by default", function() {
        return job.saveAsync().should.eventually.have.deep.property("[0].queue_id").be.undefined;
      });
    });

    describe("email", function() {
      it("is required", function() {
      	job.email = undefined;
        return job.saveAsync().should.eventually.be.rejected.and.have.deep.property("errors.email.kind", "required");
      });

      it("must be valid", function() {
      	job.email = "corgi";
        return job.saveAsync().should.eventually.be.rejected.and.have.deep.property("errors.email.message", "corgi is not a valid email address");
      });

      it("should clean up nicely", function() {
      	job.email = " TEST@EXAMPLE.COM ";
        return job.saveAsync().should.eventually.have.deep.property("[0].email", "test@example.com");
      });
    });

    describe("webserver_name", function() {
      it("is required", function() {
      	job.webserver_name = undefined;
        return job.saveAsync().should.eventually.be.rejected.and.have.deep.property("errors.webserver_name.kind", "required");
      });

      it("should clean up nicely", function() {
				job.webserver_name = " example ";
				return job.saveAsync().should.eventually.have.deep.property("[0].webserver_name", "example");
      });
    });

    describe("virtual webserver attribute", function() {
      it("should return the webserver corresponding to the webserver_name", function() {
        return job.saveAsync().should.eventually.have.deep.property("[0].webserver.constructor", express.Router);
      });

      it("should support generate_command", function() {
        return job.saveAsync().spread(function(job) {
          return job.webserver.generate_command({ rna_sequence: "GGGGGCCCCC" }).should.equal("echo GGGGGCCCCC | RNAfold");
        });
      });
    });

    describe("update_by_queue_id", function() {
      it("should call the update hook", function() {
        job.queue_id = "corgi";

        return job.saveAsync().spread(function(job) {
          return Job.update_by_queue_id(job.queue_id, "running").should.eventually.have.property("state", "running");
        });
      });
    });
  });
});
