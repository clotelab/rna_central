"use strict";

var BPromise    = require("bluebird");
var test_helper = require("../test_helper");
var path        = require("path");
var fs          = BPromise.promisifyAll(require("fs"));

describe("PBS daemon", function() {
  describe("parse_qstat", function() {
    var qstat_output;
    
    beforeEach(function() {
      return fs.readFileAsync(path.join(__dirname, "..", "files", "qstat.txt"), "utf8").then(function(file) {
        qstat_output = file;
        qstat_output.should.not.be.empty;
      });
    });
    
    it("should have qstat_output set", function() {
      
    });
  });
});
