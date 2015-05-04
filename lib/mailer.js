"use strict";

var debug       = require("debug")("rna_central:mailer");
var config      = require("config");
var nodemailer  = require("nodemailer");
var transporter = nodemailer.createTransport();

exports.send_mail = function(config) {
  if (process.env.NODE_ENV !== "development") {
    transporter.sendMail(_.extend({
      from: config.get("email_from")
    }, config));
  }
};
