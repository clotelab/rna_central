"use strict";

var path                    = require("path");
global._                    = require("underscore");
global.ap                   = require("./util/ap");
global.basedir              = path.join(__dirname, "..");
process.env.NODE_CONFIG_DIR = path.join(__dirname, "../config");
