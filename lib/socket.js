"use strict";

var debug         = require("debug")("rna_central:io");
var socket_io     = require("socket.io");
var SessionSocket = require("session.socket.io");

function Socket() {
	this.io     = {};
	this.socket = {};
}

Socket.prototype.config = function(server, session_config, cookie_config) {
	var io     = this.io     = socket_io(server);
	var socket = this.socket = new SessionSocket(io, session_config, cookie_config);

	this.set_connection(socket);

	return this;
};

Socket.prototype.set_connection = function(session_socket) {
	session_socket.on("connection", function(err, socket, session) {
	  debug("User connected");

	  if (session && !_.isEmpty(session.submitted_jobs)) {
	  	_.each(session.submitted_jobs, function(submitted_job) {
	  		debug("User tracking submitted job %s from session", submitted_job);

	  		socket.join(submitted_job);
	  	});
	  }

	  socket.on("create", function(job_nickname) {
	  	debug("User tracking current job %s", job_nickname);

	  	socket.join(job_nickname);
	  });

	  socket.on("background_done", function(job) {
	  	console.log(job);
	  });

	  socket.on("disconnect", function() {
	    debug("User disconnected");
	  });
	});
};

module.exports = new Socket();
