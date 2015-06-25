var kafka = require('kafka-node');
var sys = require('sys');

var stdin = process.openStdin();
var input;

var Producer = kafka.Producer,
    KeyedMessage = kafka.KeyedMessage,
    client = new kafka.Client(),
    producer = new Producer(client),
    km = new KeyedMessage('keyed', 'a keyed message'),
    payloads = [
	{ topic: 'countPushTopic', messages: km, partition:0 }
    ];



producer.on('ready', function () {

    stdin.addListener('data', function (d) {
	input = d.toString().substring(0, d.length-1);
	console.log('you entered ' + input);
	payloads = [
	    { topic: 'countPushTopic', messages: input, partition:0 }
	];
	producer.send(payloads, function (err, data) {
	    console.log(err || data);
	    // process.exit();
	});
    });
});

producer.on('error', function (err) {
    console.log('on error: ' + err);
});
    

// producer.send(payloads, function (err, data) {
//     producer.createTopics(['countPushTopic'], false, function (err, data) {
// 	console.log('createTopics');
// 	if(err !== null) {
// 	    console.log('err: ' + err);
// 	}
// 	console.log(data);
//     });
//     console.log(data);
// });
