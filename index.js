var app = require('express')();
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var kafka = require('kafka-node');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded( { extended: true }));
// use 'multer' for multi part form data

app.get('/', function(request, response) {
    response.sendFile(__dirname + '/index.html');
});
app.post('/messages/:action/:to', function(request, response) {
    var target = connections[request.params.to];
    if (target) {
	console.log(request.body.msg);
	target.emit(request.params.action, request.body);
	response.send(200);
    } else {
	response.send(404);
    }
});

var connections = {};

io.on('connection', function(socket) {
    console.log('user connected');
    socket.on('username', function(username) {
	console.log('received username: ' + username);
	connections[username] = socket;
    });
    socket.on('chat message', function(msg) {
	io.emit('chat message', msg);
    });
    socket.on('disconnect', function() {
	console.log('user disconnected');
    });
});

http.listen(3000, function() {
    console.log('listening on port 3000');
});
