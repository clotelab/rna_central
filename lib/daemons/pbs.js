"use strict";

var BPromise = require("bluebird");
var debug    = require("debug")("rna_central:daemons:pbs");
var path     = require("path");
var fs       = BPromise.promisifyAll(require("fs"));
var shell    = require("shelljs");
var mustache = require("mustache");

module.exports = {
  pbs_states: {
    "C": "complete",
    "E": "exiting",
    "H": "held",
    "Q": "queued",
    "R": "running",
    "T": "moving",
    "W": "waiting",
    "S": "suspended"
  },
  
  // ----------------------------------------------------------------------------------------------
  // Required
  // ----------------------------------------------------------------------------------------------
  on_tick: function() {
    if (!shell.which("qstat")) {
      debug(mustache.render("qstat command not found ({{timestamp}})", { timestamp: new Date() }));
      return;
    }
    
    shell.exec("qstat", _.bind(function(code, output) {
      debug("Exit code:", code);
      debug("Program output:", output);
      
      return this.parse_qstat(output);
    }, this));
  },
  
  // ----------------------------------------------------------------------------------------------
  // Required
  // ----------------------------------------------------------------------------------------------
  submit_job: function(webserver, run, callback) {
    if (!shell.which("qsub")) {
      debug(mustache.render("qsub command not found ({{timestamp}})", { timestamp: new Date() }));
      return callback(new Error("qsub not found"));
    }
    
    // return this.build_workspace(webserver, run).then(function(directory) {
    //
    // });
    
    shell.exec("qsub", _.bind(function(code, output) {
      debug("Exit code:", code);
      debug("Program output:", output);
      
      // return this.parse_qstat(output);
    }, this));
    
    callback(null, run, run._id);
  },
  
  sync_db: function(job) {
    
  },
  
  build_workspace: function(webserver, run) {
    var path = path.join("../../workspace", run._id);
    
    return fs.mkdirAsync(path).return(path);
  },
  
  render_job_file: function(folder, webserver, run) {
    return fs.readFileAsync("../templates/pbs_header.mustache").then(function(data) {
      return mustache.render(data, {
        nodes: "1:clotelab",
        walltime: "24:00:00",
        output_name: path.join(folder, run._id + ".log"),
        error_name: path.join(folder, run._id + ".err"),
        queue: "webserver",
        commands: "MEOW"
      });
    });
  },
  
  parse_qstat: function(string) {
    return _.chain(string.split("\n"))
      .select(function(line) {
        return line.match(/webserver\s+$/);
      })
      .map(this.parse_line, this)
      .value();
  },
  
  parse_line: function(line) {
    return _.tap(_.object(
      "job_id name user time_use state queue".split(" "), 
      line.trim().split(/\s+/)
    ), _.bind(function(job) {
      job.state = this.pbs_states[job.state];
    }, this));
  }
};
