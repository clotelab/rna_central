"use strict";

var path       = require("path");
global._       = require("underscore");
global.basedir = path.join(__dirname, "../..");
var BPromise   = require("bluebird");
var pbs        = require("../daemons/pbs");
var daemon     = require("../daemon")(pbs);
var warehouse  = require("../warehouse")({});

var user_promise = warehouse.models.User.remove().execAsync().then(function() {
  return warehouse.models.User({ email: "evansenter@gmail.com" }).saveAsync().spread(function(user) {
    console.log(user);
  });
});

var webserver_promise = warehouse.models.Webserver.remove().execAsync().then(function() {
  return warehouse.models.Webserver({ name: "Corgi", folder: "example" }).saveAsync().spread(function(webserver) {
    console.log(webserver);
  });
});

var job_promise = warehouse.models.Job.remove().execAsync();

BPromise.all([user_promise, webserver_promise, job_promise])
  .then(function() {
    return warehouse.models.User.findOneAsync({ email: "evansenter@gmail.com" }).then(function(user) {
      return warehouse.models.Webserver.findOneAsync({ name: "Corgi" }).then(function(webserver) {
        return [user, webserver];
      });
    }).spread(function(user, webserver) {
      return warehouse.models.Job({ user: user, webserver: webserver }).saveAsync();
    });
  })
  .catch(console.log.bind(console))
  // .then(process.exit);
