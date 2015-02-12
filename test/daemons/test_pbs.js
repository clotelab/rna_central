"use strict";

var BPromise    = require("bluebird");
var test_helper = require("../test_helper");
var pbs         = require("../../lib/daemons/pbs");
var path        = require("path");
var fs          = BPromise.promisifyAll(require("fs"));

describe("PBS daemon", function() {
  var simple_job = function(string) {
    return _.object(
      "job_id name user time_use state queue".split(" "), 
      string.split(" ")
    );
  };
  
  describe("parse_qstat", function() {
    var qstat_output;
    
    beforeEach(function() {
      return fs.readFileAsync(path.join(__dirname, "../files/qstat.txt"), "utf8").then(function(file) {
        qstat_output = file;
      });
    });
    
    // it("should have qstat_output set", function() {
    //   return console.dir(pbs.parse_qstat(qstat_output));
    // });
  });
  
  describe("parse_line", function() {
    it("should parse a single line", function() {
      pbs.parse_line("1176916.portal             RNAiFold2.0      apache          00:00:00 Q webserver      ")
        .should.eql(simple_job("1176916.portal RNAiFold2.0 apache 00:00:00 queued webserver"));
    });
  });
});
