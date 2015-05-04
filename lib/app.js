"use strict";

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
var warehouse     = require("./warehouse")({});
var pbs           = require("./daemons/pbs");
var daemon        = require("./daemon")(warehouse, pbs, { on_tick_freq: config.get("on_tick_freq") });
var app           = express();
var server        = require("http").Server(app);
exports.app       = app;
exports.server    = server;

debug(colors.inverse("Using configuration settings in %s.json"), process.env.NODE_ENV || "default");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
app.engine("jade", engines.jade);
app.engine("html", engines.ejs);

app.use("/favicon.ico", function(req, res) {
  res.sendStatus(200);
});

app.use(logger("dev"));

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

app.use(flash());
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: false }));
app.use(require("stylus").middleware(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));

app.use(function(req, res, next) {
  req.state = {
    base_prefix: config.get("base_prefix"),
    warehouse: warehouse
  };

  next();
});

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
