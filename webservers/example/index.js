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
    { title: "Server", path: "/submit_job", template: "server", meta: "server" },
    { title: "Extra", path: "/extra", template: "index" },
    { title: "Another", path: ["/about", "/about2"], template: "./views/about" }
  ]
});

webserver.form_builder(function(fields, validators) {
  return {
    email: fields.email({ attrs: { placeholder: "email@example.com" } }),
    rna_sequence: fields.string({ required: true, attrs: { placeholder: "GGGGCCCCAAAAUAUA" } })
  };
});

// webserver.validate_form(function() {
//
// });
//
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
