var path        = require("path");
var __          = require("underscore");
var base_router = require(path.join(__dirname, "..", "..", "core", "routes"));

module.exports = function() {
  var webserver = base_router({ title: "RNAmutants" });
  var debug     = webserver.debug;
  
  webserver.form_builder(function(form, fields, validators) {
    return form.create({
      username: fields.string({ required: true }),
      password: fields.password({ required: validators.required('You definitely want a password') }),
      confirm:  fields.password({
        required: validators.required('don\'t you know your own password?'),
        validators: [validators.matchField('password')]
      }),
      email: fields.email()
    });
  });
  
  debug(webserver.form_builder.generate_html());
    
  webserver.all("*", function(req, res, next) {
    webserver.debug(req.path);
    next();
  });  
  
  webserver.add_tab("Zombies", "/zombie", "index");
    
  return webserver;
};
