var socket    = io();
var valid_url = /jobs\/(.+)$/;

if (valid_url.test(window.location.pathname)) {
	var job = window.location.pathname.match(/jobs\/(.+)$/)[1];

	socket.emit("create", job);

	socket.on("done", function() {
		console.log("DONE!");
	});
}
