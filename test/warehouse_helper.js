var __       = require("underscore");
var BPromise = require("bluebird");

module.exports = function(db_uri) {
  return {
    warehouse: require("../core/warehouse.js")({ db_uri: db_uri }),
    clear_db:  BPromise.promisify(require("mocha-mongoose")(db_uri))
  }
};
