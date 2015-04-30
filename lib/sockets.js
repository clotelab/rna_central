"use strict";

var debug          = require("debug")("rna_central:io");
var SessionSocket  = require("session.socket.io");
var io             = {};
var session_socket = {};
var loaded         = false;

module.exports = function(server, session_config, cookie_config) {
	if (!loaded && !(server && session_config && cookie_config)) {
		throw new Error("Trying to load the cached session_socket before is was ever initialized");
	}

	if (!loaded) {
		loaded = true;

		  io             = require("socket.io")(server);
		  session_socket = new SessionSocket(io, session_config, cookie_config);

			session_socket.on("connection", function(err, socket, session) {
			  debug("User connected");

			  console.dir(socket.id);
			  console.dir(session);

			  if (session && !_.isEmpty(session.submitted_jobs)) {
			  	_.each(session.submitted_jobs, function(submitted_job) {
			  		debug("User tracking submitted job %s", submitted_job);

			  		socket.join(submitted_job);
			  	});
			  }

			  socket.on("create", function(job_nickname) {
			  	debug("User tracking current job %s", job_nickname);

			  	socket.join(job_nickname);
			  });

			  socket.on("disconnect", function() {
			    debug("User disconnected");
			  });
			});
	}

	return session_socket;
};
