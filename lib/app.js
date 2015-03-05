"use strict";

global._          = require("underscore");
var express       = require("express");
var path          = require("path");
// var favicon       = require("serve-favicon");
var logger        = require("morgan");
var engines       = require("consolidate");
var cookie_parser = require("cookie-parser");
var session       = require("express-session");
var flash         = require("connect-flash");
var body_parser   = require("body-parser");
var colors        = require("colors");
var debug         = require("debug")("rna_central:app");
var pbs           = require("./daemons/pbs");
var daemon        = require("./daemon")("*/30 * * * * *", pbs);
var warehouse     = require("./warehouse")({});
var app           = express();

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
app.engine("jade", engines.jade);
app.engine("html", engines.ejs);

// app.use(favicon(__dirname + "/public/favicon.ico"));
app.use(logger("dev"));
app.use(cookie_parser());
app.use(session({ secret: "keyboard cat", cookie: { maxAge: 60000 } }));
app.use(flash());
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: false }));
app.use(require("stylus").middleware(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));

app.use(function(req, res, next) {
  req.warehouse = warehouse;
  next();
});

app.param("webserver", function(req, res, next, webserver) {
  try {
    var server_name = _.chain(String.prototype.split.call(webserver, "/")).reject(_.isEmpty).first().value();
    req.subapp      = require(path.join(__dirname, "../webservers", webserver));
    debug("Forwarding to " + server_name + " webserver");
  } catch (err) {
    debug(err.message);
  }
  
  next();
});

app.use("/:webserver", function(req, res, next) {
  if (_.isUndefined(req.subapp)) {
    next();
  } else {
    req.subapp(req, res, next);
  }
});

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err    = new Error("Not Found");
  err.status = 404;
  next(err);
});

// Development error handler, will print stacktrace
if (app.get("env") === "development") {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render("error", {
      message: err.message,
      error: err
    });
  });
}

// Production error handler, no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render("error", {
    message: err.message,
    error: {}
  });
});

module.exports = app;
