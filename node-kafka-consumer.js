var kafka = require('kafka-node'),
    Consumer = kafka.Consumer,
    client = kafka.Client(),
    consumer = new Consumer(client, [ { topic: 'countPushTopic', partition: 0 } ], { autoCommit: false } );

consumer.on('message', function (message) {
    console.log(message);
});

consumer.on('error', function (err) {
    console.log('err: ' + err);
});

