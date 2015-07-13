var cluster = require('cluster'),
    _portSocket = 3000,
    _portRedis = 6379,
    _hostRedis = 'localhost';

// If is master
if(cluster.isMaster) {

    /* Create the server instance but don't let http listen yet. The workers will listen. This is simply to create the server instance */
    var server = require('http').createServer(),
	io = require('socket.io')(server),
	redis = require('socket.io-redis');

    io.adapter(redis({ host: _hostRedis, port: _portRedis}));

    var numCPUs = require('os').cpus().length;

    for (var i = 0; i < numCPUs; i++) {
	cluster.fork();
    }

    cluster.on('fork', function (worker) {
	console.log("worker %s spawned", worker.id);
    });

    cluster.on('online', function (worker) {
	console.log("worker %s is online", worker.id);
    });

    cluster.on('listening', function (worker, addr) {
	console.log("worker %s is listening on %s:%d", worker.id, addr.address, addr.port);
    });

    cluster.on('disconnect', function (worker) {
	console.log("worker %s disconnected", worker.id);
    });

    cluster.on('exit', function (worker, code, signal) {
	console.log("worker %s died (%s)", worker.id, signal || code);
	if(! worker.suicide) {
	    console.log('restarting worker');
	    cluster.fork();
	}
    });
}

/* If is worker */
if(cluster.isWorker) {
    console.log('worker');
    /* Create the server instance same as before but this time, listen on port */
    var express = require('express'),
	app = express(),
	path = require('path'),
	cors = require('cors'),
	bodyParser = require('body-parser'),
	ent = require('ent'),
	fs = require('fs'),
	server = require('http').createServer(app).listen(_portSocket),
	io = require('socket.io')(server),
	redis = require('socket.io-redis');

    var kafka = require('kafka-node'),
	Consumer = kafka.Consumer,
	client = kafka.Client('localhost:2181', cluster.worker.id.toString(), {}),
	consumer = new Consumer(client, [ { topic: 'candidate_activity'} ], { groupId: 'candidate_activity_consumer_group', autoCommit: true } );
    
    app.set('view engine', 'ejs');
    app.set ('views', __dirname + '/views');
    // app.use(app.static(__dirname + '/public'));

    app.use(cors());

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded( { extended: true }));
    // use 'multer' for multipart form data

    app.use(express.static(path.join(__dirname, 'public')));

    io.adapter(redis({ host: _hostRedis, port: _portRedis }));

    app.get('/', function (request, response) {
	console.log('hitting here');
	response.render('boot', {title: 'Login page', errormsg: ''});
    });

    app.post('/:candidate', function (request, response) {
	response.render('home', {title: 'Candidate Home', welcomemsg: 'Welcome ' + request.params.candidate, candidate: request.params.candidate});
    });

    app.post('/logout', function (request, response) {
	response.render('boot');
    });

    io.sockets.on('connection', function (socket) {

	console.log('user connected to ' + cluster.worker.id);
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
	    console.log("worker id : " + cluster.worker.id);
	    io.to(cand_activity.name).emit('activity', cand_activity.activity);
	} catch(e) {
	    console.log("Error: " + e);
	}

	// io.sockets.emit('activity', message.value);
    });

    /*
    socketIO.on('connection', function (socket) {
	socket.on("new_client", function (pseudo) {
	    pseudo = ent.encode(pseudo);
	    socket.pseudo = pseudo;
	    try {
		socket.broadcast.emit('new_client', pseudo);
	    } catch (e) {
		socket.emit('new_client', pseudo);
	    }
	});

	socket.on('message', function (message) {
	    message = ent.encode(message);
	    try {
		socket.broadcast.emit('message', {pseudo: socket.pseudo, message: message});
	    } catch (e) {
		console.log('error here');
	    }
	});

	socket.on('moveObject', function (object_name, object_position, object_rotation) {
	    var object_name = ent(object_name);
	    var position = ent(object_position);
	    var rotation = ent(object_rotation);
	    try {
		socket.broadcast.emit('moveObject', {name: object_name, position: object_position, rotation: object_rotation});
	    } catch (e) {
		console.log('error here too');
	    }
	});
    });
     */
    
}
