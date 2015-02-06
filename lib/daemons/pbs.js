"use strict";

var debug    = require("debug")("rna_central:daemons:pbs");
var shell    = require("shelljs");
var mustache = require("mustache");

// C -     Job is completed after having run/
// E -  Job is exiting after having run.
// H -  Job is held.
// Q -  job is queued, eligible to run or routed.
// R -  job is running.
// T -  job is being moved to new location.
// W -  job is waiting for its execution time
//      (-a option) to be reached.
// S -  (Unicos only) job is suspend.

module.exports = {
  on_tick: function() {
    if (!shell.which("qstat")) {
      debug(mustache.render("qstat command not found ({{timestamp}})", { timestamp: new Date() }));
      return; 
    }
    
    shell.exec("qstat", _.bind(function(code, output) {
      debug("Exit code:", code);
      debug("Program output:", output);
    }, this));
  },
  
  parse_qstat: function(string) {
    
  }
};
