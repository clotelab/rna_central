"use strict";

var bluebird   = require("bluebird");
var util       = require("util");
var path       = require("path");
var fs         = bluebird.promisifyAll(require("fs-extra"));
var debug      = require("debug")("rna_central:mailer");
var config     = require("config");
var mustache   = require("mustache");
var nodemailer = require("nodemailer");

function Mailer() {
	this.sender = {};
}

Mailer.prototype.config = function(transport) {
	this.sender = nodemailer.createTransport(transport);

	bluebird.promisifyAll(this.sender);

	return this;
};

Mailer.prototype.send_mail = function(options) {
  if (!_.includes(["development", "test"], process.env.NODE_ENV)) {
    return this.sender.sendMailAsync(_.extend({
      from: config.get("email_from")
    }, options));
  } else {
  	return bluebird.resolve();
  }
};

Mailer.prototype.send_mail_about_job = function(job) {
	fs.readFileAsync(
		path.join(basedir, "lib/templates/job_status_update.mustache"),
		"utf-8"
	).bind(this).then(function(template) {
		var message_body = mustache.render(template, {
			webserver: job.webserver.title,
			nickname: job.nickname,
			state: job.state,
			job_url: job.email_url
		});

		this.send_mail({
			to: job.email,
			subject: util.format("%s: job %s is now flagged as %s", job.webserver.title, job.nickname, job.state),
			body: message_body
		});
	}).catch(console.log.bind(console));
};

module.exports = new Mailer();
