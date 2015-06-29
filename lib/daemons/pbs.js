"use strict";

var bluebird      = require("bluebird");
var debug         = require("debug")("rna_central:daemons:pbs");
var path          = require("path");
var fs            = bluebird.promisifyAll(require("fs-extra"));
var child_process = bluebird.promisifyAll(require("child_process"));
var shell         = bluebird.promisifyAll(require("shelljs"));
var mustache      = require("mustache");
var pbs_template  = path.join(basedir, "lib/templates/pbs_header.mustache");
var catcher       = require("../util/catcher");
var daemon        = require("../daemon");
var socket        = require("../socket");
var pbs_mapping   = {
  "C": "complete",
  "E": "exiting",
  "H": "held",
  "Q": "queued",
  "R": "running",
  "T": "moving",
  "W": "waiting",
  "S": "suspended"
};

var pbs = module.exports = {
  pbs_states: _.extend({}, pbs_mapping, _.invert(pbs_mapping)),

  // ----------------------------------------------------------------------------------------------
  // Required
  // ----------------------------------------------------------------------------------------------
  on_tick: function() {
    if (process.env._system_type === "Linux" && shell.which("qstat")) {
      child_process.execAsync("qstat").bind(this)

        //
        .spread(_.identity)

        //
        .then(this.parse_qstat)

        //
        .then(this.sync_db)

        //
        .catch(catcher);
    } else if (!_.includes(["development", "test"], process.env.NODE_ENV)) {
      debug("qstat command not found (%s)", new Date());
    }
  },

  // ----------------------------------------------------------------------------------------------
  // Required
  // ----------------------------------------------------------------------------------------------
  submit_job: function(webserver, job) {
    // Build the workspace folder for the job, returning the folder path
    return job.build_workspace().bind(job)

      // Then copy every file from the webserver's manifest object into the workspace
      .then(job.dup_manifest)

      // Then generate the PBS script in the workspace
      .then(_.partial(this.render_job_file, _, webserver, job))

      // Then submit the job by calling qsub on the command line
      .then(this.qsub_script_file);
  },

  // ----------------------------------------------------------------------------------------------
  // Nothing below here is required for general daemon support
  // ----------------------------------------------------------------------------------------------
  sync_db: function(qstat_output) {
    bluebird.all(_.map(qstat_output, function(qstat_entry) {
      return daemon.db.Job.update_by_queue_id(qstat_entry.queue_id, qstat_entry.state);
    })).then(function(searched_jobs) {
      var updated_jobs = _.chain(searched_jobs).compact().map(function(job) {
        socket.io.to(job.nickname).emit("background_done", job);
      });

      if (updated_jobs.length > 0) {
        debug("A total of %d jobs were updated", updated_jobs.length);
      }
    }).catch(catcher);
  },

  render_job_file: function(workspace, webserver, job) {
    var script_prefix = path.join(workspace, job.nickname);
    var commands      = webserver.generate_command.call(job, job.data);

    debug("%s generated the following command:", job.nickname);
    debug(commands);

    return fs.readFileAsync(pbs_template, "utf-8").then(function(template) {
      return fs.writeFileAsync(
        script_prefix + ".sh",
        mustache.render(template, {
          nodes: "1:clotelab",
          walltime: "24:00:00",
          output_name: script_prefix + ".log",
          error_name: script_prefix + ".err",
          queue: "webserver",
          commands: commands
        })
      ).catch(catcher).return(script_prefix + ".sh");
    });
  },

  qsub_script_file: function(script_file) {
    var shell_command = mustache.render("qsub {{{script_file}}}", { script_file: script_file });

    debug(shell_command);

    return child_process.execAsync(shell_command, {
      cwd: this.workspace_path
    }).spread(function(stdout) {
      return stdout.trim();
    });
  },

  parse_qstat: function(string) {
    return _.chain(string.split("\n"))
      .select(function(line) {
        return line.match(/webserver\s*$/);
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
