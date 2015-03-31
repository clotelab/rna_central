"use strict";

global._       = require("underscore");
global.ap      = _.compose(console.log.bind(console), require("prettyjson").render);
global.basedir = __dirname;
var BPromise   = require("bluebird");
var pbs        = require("./lib/daemons/pbs");
var daemon     = require("./lib/daemon")(false, pbs);
var warehouse  = require("./lib/warehouse")({});

var user_promise = warehouse.models.User.remove().execAsync().then(function() {
  return warehouse.models.User({ email: "evansenter@gmail.com" }).saveAsync().spread(function(user) {
    console.log(user);
  });
});

var webserver_promise = warehouse.models.Webserver.remove().execAsync().then(function() {
  return warehouse.models.Webserver({ name: "Corgi" }).saveAsync().spread(function(webserver) {
    console.log(webserver);
  });
});

BPromise.all([user_promise, webserver_promise])
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
