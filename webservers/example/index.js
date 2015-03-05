"use strict";

var path        = require("path");
var base_router = require(path.join(__dirname, "../../lib/routes"));
var webserver   = module.exports = base_router({ 
  // This is cookie cutter config. Having a hook to the module object allows us to handle things like paths correctly in lib/routes
  module: module,
  // The title is the pretty name for the webserver. It is used for the UI across the webserver instance.
  title: "RNAmutants",
  // The tabs option supports the following keys: "default", "none", or an array of tab objects having keys [title, path, template].
  // The title key is the pretty name for the tab, the path string / array are the subpaths that point to this tab and the template
  // key is a path that points to the HTML file for the tab. Files are looked up relative to the current directory, or in lib/views
  tabs: [
    { title: "Server", path: "/submit_job", template: "server", meta: "form" },
    { title: "Extra", path: "/extra", template: "index" },
    { title: "Another", path: ["/about", "/about2"], template: "./views/about" }
  ]
});

webserver.form_builder(function(fields, validators, widgets) {
  return {
    email: fields.email({ 
      required: true,
      cssClasses: { field: ["pure-control-group"] },
      widget: widgets.text({ placeholder: "email@example.com", required: "true" } )
    }),
    rna_sequence: fields.string({
      required: true,
      cssClasses: { field: ["pure-control-group"] },
      widget: widgets.text({ placeholder: "GGGGCCCCAAAAUAUA", required: "true" } )
    })
  };
});

webserver.form_validator(function(form, flash) {
  flash("Shit is fucked.");
});

// webserver.generate_command(function() {
//
// });
//
// webserver.finish_job(function() {
//
// });

webserver.all("*", function(req, res, next) {
  webserver.debug(req.path);
  next();
});
  
return webserver;
