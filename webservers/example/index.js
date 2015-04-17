"use strict";

var path        = require("path");
var base_router = require(path.join(basedir, "lib/subapp"));
var webserver   = module.exports = base_router({ 
  // This is cookie cutter config. Having a hook to the module object allows us to handle things like paths correctly in lib/subapp
  module: module,

  // The title is the pretty name for the webserver. It is used for the UI across the webserver instance.
  title: "RNAmutants",

  // The webserver is completely inaccessible until the active: true flag is set. It's possible that the cache needs to get busted
  // on this if changing the flag seems to have no effect, since require() calls are cached.
  active: true,

  // The tabs option supports the following keys: "default", "none", or an array of tab objects having keys [title, path, template].
  // The title key is the pretty name for the tab, the path string / array are the subpaths that point to this tab and the template
  // key is a path that points to the HTML file for the tab. Files are looked up relative to the current directory, or in lib/views
  tabs: [
    { title: "Server", path: "/submit_job", template: "server", meta: "form" },
    { title: "Extra", path: "/extra", template: "index" },
    { title: "Another", path: ["/about", "/about2"], template: "./views/about" }
  ], 
  
  // The list of files that will be copied to the workspace for the currently running job. If you use relative paths outside the
  // scope of this folder YOU ARE GOING TO HAVE A BAD TIME. Keep all dependencies within this folder, so the file system doesn't
  // become cripplingly coupled to the framework's location.
  file_manifest: [
    "./files/example_required_file.txt"
  ]
});

webserver.form_builder(function(fields, validators, widgets) {
  return {
    email: fields.email({ 
      required: true,
      cssClasses: { field: ["pure-control-group"] },
      widget: widgets.text({ placeholder: "email@example.com", required: "true" }),
      value: "email@example.com"
    }),
    rna_sequence: fields.string({
      required: true,
      cssClasses: { field: ["pure-control-group"] },
      widget: widgets.text({ placeholder: "GGGGGCCCCC", required: "true" }),
      value: "GGGGGCCCCC"
    })
  };
});

webserver.form_validator(function(form_data) {
  webserver.debug(form_data);
  return true;
});

webserver.pbs_command(function() {
  return "echo GGGGGCCCCC | RNAfold";
});

webserver.finish_job(function() {

});
  
return webserver;
