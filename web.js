var http = require('http');
var redis = require('redis-url').connect(process.env.REDISTOGO_URL);
var pusher = require('pusher-url').connect(process.env.PUSHER_URL);

var express = require('express');
var app = express();
app.use(express.bodyParser());

var port = process.env.PORT || 5000;

app.get('/:key', function(req, res) {
    redis.get(req.params.key, function(err, value) {
        res.json({'value': value});
    });
});

app.put('/:key', function(req, res) {
    var input = req.body.value;
    redis.set(req.params.key, input);
    redis.get(req.params.key, function(err, value) {
        res.json({'value': value});
        pusher.trigger(req.params.key, 'set', {'value': value});
    });
});

app.listen(port, function() {
    console.log("Listening on " + port);
});
