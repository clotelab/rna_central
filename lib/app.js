"use strict";

// This attaches things to the global and process.env object, get over it
require("./globals");

var express       = require("express");
var path          = require("path");
var config        = require("config");
var logger        = require("morgan");
var engines       = require("consolidate");
var cookie_parser = require("cookie-parser");
var session       = require("express-session");
var MongoStore    = require("connect-mongo")(session);
var flash         = require("connect-flash");
var body_parser   = require("body-parser");
var colors        = require("colors");
var debug         = require("debug")("rna_central:app");
var mailer        = require("./mailer");
var warehouse     = require("./warehouse");
var pbs           = require("./daemons/pbs");
var daemon        = require("./daemon");
var app           = express();
var server        = require("http").Server(app);

// We export this way because I need a reference to server for socket.io
exports.app    = app;
exports.server = server;

debug(colors.inverse("Running with NODE_ENV set as %s"), app.get("env"));

// Configuring app-specific singleton objects
if (app.get("env") === "development") {
  var transport = require("nodemailer-stub-transport");
} else {
  var transport = require("nodemailer-direct-transport");
}

mailer.config(transport());
warehouse({});
daemon.config(warehouse, pbs);

// Setting view engines
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
app.engine("jade", engines.jade);
app.engine("html", engines.ejs);

// Screw favicons
app.use("/favicon.ico", function(req, res) {
  res.sendStatus(200);
});

// Logging style
app.use(logger("dev"));

// Setting cookies and sessions to setup socket.io
var cookie_config = cookie_parser(config.get("session_secret"));
app.use(cookie_config);

var session_config = new MongoStore({ mongooseConnection: warehouse.connection });
app.use(session({
  store: session_config,
  secret: config.get("session_secret"),
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

var session_socket = require("./sockets")(server, session_config, cookie_config);

// Setup flash messages, POST parsers, CSS compiling and static content paths
app.use(flash());
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: false }));
app.use(require("stylus").middleware(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));

// Attach a state object to req, which holds req-specific state that all requests probably need
app.use(function(req, res, next) {
  req.state = {
    base_prefix: config.get("base_prefix"),
    warehouse: warehouse
  };

  next();
});

// Define how to parse the webserver param from requests to forward routing to the appropriate subapp
app.param("webserver", function(req, res, next, webserver) {
  try {
    var server_name  = _.chain(String.prototype.split.call(webserver, "/")).reject(_.isEmpty).first().value();
    var server_path  = path.join(__dirname, "../webservers", webserver);
    req.state.subapp = require(server_path).bootstrap();
    debug("Forwarding to %s webserver", server_name);
  } catch (err) {
    debug(err.message);
  }

  next();
});

// Attach route to nest all requests to the appropriate subapp
app.use("/:webserver", function(req, res, next) {
  if (_.isUndefined(req.state.subapp) || req.state.subapp.active !== true) {
    if (req.state.subapp.active !== true) {
      debug("%s is not flagged as an active webserver, ignoring all requests", req.state.subapp.id);
    }

    next();
  } else {
    req.state.subapp(req, res, next);
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
