"use strict";

var BPromise     = require("bluebird");
var debug        = require("debug")("rna_central:daemons:pbs");
var path         = require("path");
var fs           = BPromise.promisifyAll(require("fs-extra"));
var shell        = require("shelljs");
var mustache     = require("mustache");
var pbs_template = path.join(basedir, "lib/templates/pbs_header.mustache");

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
    if (process.env._system_type === "Linux" && shell.which("qstat")) {
      shell.exec("qstat", _.bind(function(code, output) {
      debug("Exit code:", code);
      debug("Program output:", output);
      
      return this.parse_qstat(output);
    }, this));
    } else {
      debug(mustache.render("qstat command not found ({{timestamp}})", { timestamp: new Date() }));
    }
  },
  
  // ----------------------------------------------------------------------------------------------
  // Required
  // ----------------------------------------------------------------------------------------------
  submit_job: function(webserver, job, callback) {
    if (process.env._system_type === "Linux" && shell.which("qsub")) {
      // Build the workspace folder for the job, returning the folder path
      webserver.build_workspace(job)

        // Then copy every file from the webserver's manifest object into the workspace
        .then(_.bind(webserver.dup_manifest, webserver))

        // Then generate the PBS script in the workspace
        .then(_.partial(this.render_job_file, _, webserver, job))

        // Then submit the job by calling qsub on the command line
        .then(this.qsub_script_file)

        // Then execute the callback with the job and job_id returned from the qsub submission
        .then(function(job_id) {
          callback(null, job, job_id);
        })

        // Catch all errors and forward them to the callback
        .catch(callback);
    } else {
      debug(mustache.render("qsub command not found ({{timestamp}})", { timestamp: new Date() }));
      
      return callback(new Error("qsub not found"));
    }
  },
  
  sync_db: function(job) {
    
  },
  
  render_job_file: function(workspace, webserver, job) {
    var script_prefix = path.join(workspace, job._id.toString());
    var commands      = webserver.router.generate_command();
        
    return fs.readFileAsync(pbs_template, "utf-8").then(function(data) {
      return fs.writeFileAsync(
        script_prefix + ".sh",
        mustache.render(data, {
          nodes: "1:clotelab",
          walltime: "24:00:00",
          output_name: script_prefix + ".log",
          error_name: script_prefix + ".err",
          queue: "webserver",
          commands: commands
        })
      ).return(script_prefix + ".sh");
    });
  },
  
  qsub_script_file: function(script_file) {
    var shell_command = mustache.render("qsub {{{script_file}}}", { script_file: script_file });
    
    return shell.exec(
      mustache.render("qsub {{script_file}}", { script_file: script_file }),
      _.bind(function(code, output) {
        debug("Exit code:", code);
        debug("Program output:", output);

      return output;
      }, this)
    );
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
      "queue_id name user time_use state queue".split(" "), 
      line.trim().split(/\s+/)
    ), _.bind(function(job) {
      job.state = this.pbs_states[job.state];
    }, this));
  }
};
