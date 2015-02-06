"use strict";

var __            = require("underscore");
var express       = require("express");
var path          = require("path");
var favicon       = require("serve-favicon");
var logger        = require("morgan");
var engines       = require("consolidate");
var cookie_parser = require("cookie-parser");
var body_parser   = require("body-parser");
var debug         = require("debug")("rna_central:app");
var daemon        = require("./daemon")("*/10 * * * * *");
var warehouse     = require("./warehouse")({});
var app           = express();

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
app.engine("jade", engines.jade);
app.engine("html", engines.ejs);

// app.use(favicon(__dirname + "/public/favicon.ico"));
app.use(logger("dev"));
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: false }));
app.use(cookie_parser());
app.use(require("stylus").middleware(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));

app.use(function(req, res, next) {
  req.warehouse = warehouse;
  next();
});

__.each(["pure-min", "grids-responsive-min", "grids-responsive-old-ie-min"], function(file) {
  app.get("/stylesheets/" + file + ".css", function(req, res) {
      res.sendFile(path.join(__dirname, "..", "node_modules", "purecss", file + ".css"));
  });
});

app.get("/stylesheets/font-awesome.min.css", function(req, res) {
    res.sendFile(path.join(__dirname, "..", "node_modules", "font-awesome", "css", "font-awesome.min.css"));
});

app.param("webserver", function(req, res, next, webserver) {
  try {
    var server_name = __.chain(String.prototype.split.call(webserver, "/")).reject(__.isEmpty).first().value();
    var load_server = require(path.join(__dirname, "..", "webservers", webserver));
    req.subapp      = load_server();
    debug("Successfully loaded the " + server_name + " webserver");
  } catch (err) {
    debug(err.message);
  }
  
  next();
});

app.use("/:webserver", function(req, res, next) {
  if (__.isUndefined(req.subapp)) {
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