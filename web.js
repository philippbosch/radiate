var http = require('http');
var redis = require('redis-url').connect(process.env.REDISTOGO_URL);
var pusher = require('pusher-url').connect(process.env.PUSHER_URL);

var server = http.createServer();

server.on('request', function(req, res) {
    var key = req.url.substr(1);

    if (!key) {
        res.end('Key missing.');
    }

    switch(req.method) {
        case 'GET':
            redis.get(key, function(err, value) {
                res.end(value);
            });
            break;

        case 'PUT':
            var value = '';

            req.on('data', function(chunk) {
                value += chunk;
            });

            req.on('end', function() {
                redis.set(key, value);
                res.end('OK');
                pusher.trigger(key, 'set', {'value': value});
            });
            break;
    }
});

var port = process.env.PORT || 5000;
server.listen(port, function() {
    console.log("Listening on " + port);
});