var express = require('express');
var app = express();
var path = require('path');
var cors = require('cors');
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var kafka = require('kafka-node'),
    Consumer = kafka.Consumer,
    client = kafka.Client(),
    consumer = new Consumer(client, [ { topic: 'candidate_activity', partition: 0 } ], { autoCommit: false } );
var connections = {};

var client2 = kafka.Client();
// var consumer2 = new Consumer(client2, [{topic: 'socktopic', partition: 0}], {autoCommit: false});

app.set('view engine', 'ejs');
app.set ('views', __dirname + '/views');
// app.use(app.static(__dirname + '/public'));

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded( { extended: true }));
// use 'multer' for multipart form data

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(request, response) {
    response.render('boot', {title: 'Login page', errormsg: ''});
});

app.post('/:candidate', function (request, response) {
    response.render('home', {title: 'Candidate Home', welcomemsg: 'Welcome ' + request.params.candidate, candidate: request.params.candidate});
});

app.post('/logout', function (request, response) {
    response.render('boot');
});

var rooms = {};

io.sockets.on('connection', function (socket) {

    console.log('user connected with tranport ' + socket.conn.transport.name);
    socket.on('join_room', function(data) {
    	console.log('Joining room: ' + data.newroom);
	socket.room = data.newroom;
	socket.join(data.newroom);
	// console.log('Room info: ' + socket.rooms);
    	socket.emit('update', 'You are connected to ' + data.newroom);
    });
    
    /* Handle disconnect */
    socket.on('disconnect', function () {
	console.log('User disconnected ' + socket);
	socket.leave(socket.room);
    });
});

consumer.on('message', function (message) {
    console.log('consumer called : ' + message.value);

    try {
	var cand_activity = JSON.parse(message.value);
	console.log(cand_activity.name);
	console.log(cand_activity.activity);
	io.to(cand_activity.name).emit('activity', cand_activity.activity);
    } catch(e) {
	console.log("Error: " + e);
    }

    // io.sockets.emit('activity', message.value);
});

// consumer2.on('message', function(message) {
//     console.log('consumer 2 called ' + message.value);
//     io.to('karthic').emit('activity', message.value);
// });

http.listen(3000, function() {
    console.log('listening on port 3000');
});
