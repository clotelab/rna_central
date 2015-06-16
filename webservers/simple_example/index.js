"use strict";

// ----------------------------------------------------------------------------------------------------
// This is an example simple webserver using the rna_central framework, where most of the work is done
// automagically by the framework. For an example where the settings are predominantly overridden, see
// the complex_example
// ----------------------------------------------------------------------------------------------------

var path        = require("path");
var fs          = require("fs");
var util        = require("util");
var base_router = require(path.join(basedir, "lib/subapp"));
var webserver   = module.exports = base_router({
  // This is cookie cutter config. Having a hook to the module object allows us to handle things like paths correctly in lib/subapp
  module: module,

  // The title is the pretty name for the webserver. It is used for the UI across the webserver instance.
  title: "RNAfold",

  // The tabs option supports the following keys: "default", "none", or an array of tab objects having keys [title, path, template].
  // The title key is the pretty name for the tab, the path string / array are the subpaths that point to this tab and the template
  // key is a path that points to the HTML file for the tab. Files are looked up relative to the current directory, or in lib/views
  tabs: [
    {
      title: "Home",
      path: "/",
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
    }
  ]
});

webserver.form_config = function(fields, widgets) {
  // "this" is the caolan/forms generator, but you should never need it. Just return the proper config object
  return {
    email: fields.string({
      widget: widgets.text({ placeholder: "email@example.com" })
    }),

    rna_sequence: fields.string({
      label_text: "RNA Sequence",
      widget: widgets.text({ placeholder: "GGGAAACCC" })
    })
  };
};

webserver.form_validator = function(form_data, validate) {
  // "this" is the caloan/forms instance generated from webserver.form_config
  validate.isEmail({
    key: "email",
    message: "{{value}} is not a valid email",
    allow_empty: true
  });

  validate.is_rna({
    key: "rna_sequence",
    message: "The provided RNA sequence is invalid"
  });

  if (form_data.rna_sequence && form_data.rna_sequence.length > 100) {
    validate.set_invalid({
      key: "rna_sequence",
      message: "The RNA sequence must be under 100 nt. long",
      allow_empty: true
    });
  }
};

webserver.generate_command = function(job_data) {
  // "this" is the job itself, incase any fancy stuff from the job is needed
  return util.format("echo %s | RNAfold --noPS > %s.out", job_data.rna_sequence, this.nickname);
};

webserver.finish_job = function() {};

webserver.display_results = function(req, res, next) {
  // "this" is the job itself, in case any fancy stuff from the job is needed
  res.render("results", { data: fs.readFileSync(this.workspace_file(".out"), "utf-8") });
};
