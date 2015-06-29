"use strict";

var bluebird    = require("bluebird");
var test_helper = require("../test_helper");
var path        = require("path");
var fs          = bluebird.promisifyAll(require("fs"));
var catcher     = require("../../lib/util/catcher");
var pbs         = require("../../lib/daemons/pbs");

describe("PBS daemon", function() {
  var simple_job = function(string) {
    return _.object(
      "queue_id name user time_use state queue".split(" "),
      string.split(" ")
    );
  };

  describe("parse_qstat", function() {
    var qstat_output;

    beforeEach(function() {
      return fs.readFileAsync(path.join(__dirname, "../files/qstat.txt"), "utf8").then(function(file) {
        qstat_output = file;
      }).catch(catcher);
    });
  });

  describe("parse_line", function() {
    it("should parse a single line", function() {
      pbs.parse_line("1176916.portal             RNAiFold2.0      apache          00:00:00 Q webserver      ")
        .should.eql(simple_job("1176916.portal RNAiFold2.0 apache 00:00:00 queued webserver"));
    });
  });
});
