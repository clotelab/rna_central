"use strict";

var express       = require("express");
var path          = require("path");
global._          = require("underscore");
global.basedir    = path.join(__dirname, "..");
// var favicon       = require("serve-favicon");
var logger        = require("morgan");
var engines       = require("consolidate");
var cookie_parser = require("cookie-parser");
var session       = require("express-session");
var MongoStore    = require("connect-mongo")(session);
var flash         = require("connect-flash");
var body_parser   = require("body-parser");
var colors        = require("colors");
var debug         = require("debug")("rna_central:app");
var warehouse     = require("./warehouse")({});
var pbs           = require("./daemons/pbs");
var daemon        = require("./daemon")(warehouse, pbs, { on_tick_freq: "*/10 * * * * *" });
var app           = express();

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
app.engine("jade", engines.jade);
app.engine("html", engines.ejs);

// app.use(favicon(__dirname + "/public/favicon.ico"));
app.use(logger("dev"));
app.use(cookie_parser("keyboard cat"));
app.use(session({
  store: new MongoStore({ mongooseConnection: warehouse.connection }),
  secret: "keyboard cat",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}));
app.use(flash());
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: false }));
app.use(require("stylus").middleware(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));

app.use(function(req, res, next) {
  req.rna_central = {
    base_prefix: process.env.BASE_PREFIX || "",
    warehouse: warehouse
  };

  next();
});

app.param("webserver", function(req, res, next, webserver) {
  try {
    var server_name        = _.chain(String.prototype.split.call(webserver, "/")).reject(_.isEmpty).first().value();
    var server_path        = path.join(__dirname, "../webservers", webserver);
    req.rna_central.subapp = require(server_path);
    debug("Forwarding to " + server_name + " webserver");
  } catch (err) {
    debug(err.message);
  }

  next();
});

app.use("/:webserver", function(req, res, next) {
  if (_.isUndefined(req.rna_central.subapp) || req.rna_central.subapp.active !== true) {
    if (req.rna_central.subapp.active !== true) {
      debug(req.rna_central.subapp.id + " is not flagged as an active webserver, ignoring all requests");
    }

    next();
  } else {
    req.rna_central.subapp(req, res, next);
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
