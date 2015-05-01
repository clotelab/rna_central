"use strict";

var socket    = io("http://bioinformatics.bc.edu", { path: "/clotelab/rna_central/socket.io" });
var valid_url = /jobs\/(.+)$/;

if (valid_url.test(window.location.pathname)) {
	var job = window.location.pathname.match(/jobs\/(.+)$/)[1];

	socket.emit("create", job);

	socket.on("done", function(finished_job_nickname) {
		if (job === finished_job_nickname) {
			window.location.reload();
		}
	});
}
