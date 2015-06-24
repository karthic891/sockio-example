var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(request, response) {
    response.sendFile(__dirname + '/index.html');
});

io.on('connect', function(socket) {
    console.log('a user is connected');
    socket.on('disconnect', function() {
	console.log('user disconnected');
    });
});

http.listen(3000, function() {
    console.log('listening on port 3000');
});
