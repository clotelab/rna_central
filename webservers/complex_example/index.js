"use strict";

var path        = require("path");
var fs          = require("fs");
var util        = require("util");
var base_router = require(path.join(basedir, "lib/subapp"));
var webserver   = module.exports = base_router({
  // This is cookie cutter config. Having a hook to the module object allows us to handle things like paths correctly in lib/subapp
  module: module,

  // The title is the pretty name for the webserver. It is used for the UI across the webserver instance.
  title: "RNAfold",

  // The webserver is completely inaccessible until the active: true flag is set. It's possible that the cache needs to get busted
  // on this if changing the flag seems to have no effect, since require() calls are cached.
  active: true,

  // The tabs option supports the following keys: "default", "none", or an array of tab objects having keys [title, path, template].
  // The title key is the pretty name for the tab, the path string / array are the subpaths that point to this tab and the template
  // key is a path that points to the HTML file for the tab. Files are looked up relative to the current directory, or in lib/views
  tabs: [
    {
      title: "Home",
      path: ["/", "/home"],
      template: "home",
      content: {
        usage: fs.readFileSync(path.join(__dirname, "views/usage.html"), "utf-8")
      }
    },
    {
      title: "Server",
      path: "/submit_job",
      template: "server",
      content: {
        usage: "Provide a RNA sequence below to be folded using the RNAfold executable on our servers."
      }
    },
    {
      title: "About",
      path: "/info",
      template: "./views/about"
    }
  ],

  // The list of files that will be copied to the workspace for the currently running job. If you use relative paths outside the
  // scope of this folder YOU ARE GOING TO HAVE A BAD TIME. Keep all dependencies within this folder, so the file system doesn't
  // become cripplingly coupled to the framework's location.
  file_manifest: [
    "./files/example_required_file.txt"
  ]
});

webserver.form_config = function(fields, widgets) {
  // "this" is the caolan/forms generator, but you should never need it. Just return the proper config object
  return {
    email: fields.string({
      cssClasses: { field: ["pure-control-group"] },
      widget: widgets.text({ placeholder: "email@example.com" })
    }),

    rna_sequence: fields.string({
      cssClasses: { field: ["pure-control-group"] },
      widget: widgets.text({ placeholder: "GGGGGCCCCC" })
    })
  };
};

webserver.form_validator = function(form_data, validate) {
  // "this" is the caloan/forms instance generated from webserver.form_config
  validate.isEmail({
    key: "email",
    message: "The email address is invalid",
    allow_empty: true
  });

  validate.is_rna({
    key: "rna_sequence",
    message: "The RNA sequence '{{value}}' is invalid"
  });

  if (!/^ggg/i.test(form_data.rna_sequence)) {
    validate.set_invalid({
      key: "rna_sequence",
      message: "The RNA sequence must start with GGG"
    });
  }
};

webserver.generate_command = function(job_data) {
  // "this" is the job itself, incase any fancy stuff from the job is needed
  return util.format("echo %s | RNAfold > %s.out", job_data.rna_sequence, this.nickname);
};

webserver.finish_job = function(files) {
  // "this" is the job itself, in case any fancy stuff from the job is needed
  ap(files);
};

webserver.display_results = function(req, res, next) {
  // "this" is the job itself, in case any fancy stuff from the job is needed
  res.render("results", { data: fs.readFileSync(this.workspace_file(".out"), "utf-8") });
};
