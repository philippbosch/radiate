var http = require('http');
var redis = require('redis-url').connect(process.env.REDISTOGO_URL);
var pusher = require('pusher-url').connect(process.env.PUSHER_URL);

var express = require('express');
var app = express();
app.use(express.bodyParser());

/* CORS */
app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.options('*', function(req, res, next) {
    res.send(200);
});

/* Getting data */
app.get('/:key', function(req, res) {
    redis.get(req.params.key, function(err, value) {
        res.json({'value': value});
    });
});

/* Setting and manipulating data */
app.put('/:key', function(req, res) {
    var key = req.params.key;

    var callback = function() {
        redis.get(key, function(err, value) {
            // TODO: error handling
            res.json({'value': value});
            pusher.trigger('updates', 'update:' + key, {'value': value});
        });
    };

    if (req.body.value !== undefined) {
        var input = req.body.value;
        redis.set(key, input, callback);
    } else if (req.body.action !== undefined) {
        var action = req.body.action.toUpperCase();
        var params = req.body.params || [];
        var pl = params.length;

        if (action == 'INCR') {
            redis.incr(key, callback);
        } else if (action == 'INCRBY' && pl == 1) {
            redis.incrby(key, params[0], callback);
        } else if (action == 'INCRBYFLOAT' && pl == 1) {
            redis.incrbyfloat(key, params[0], callback);
        } else if (action == 'DECR') {
            redis.decr(key, callback);
        } else if (action == 'DECRBY' && pl == 1) {
            redis.decrby(key, params[0], callback);
        } else if (action == 'APPEND' && pl == 1) {
            redis.append(key, params[0], callback);
        } else {
            res.send(500);
        }
    }
});

/* Deleting data */
app.delete('/:key', function(req, res) {
    var key = req.params.key;
    redis.get(key, function(err, value) {
        redis.del(key, function(err, deleted) {
            res.send(204);
            pusher.trigger('updates', 'update:' + key, {'value': null});
            pusher.trigger('deletes', 'delete:' + key, {'deleted': deleted, 'lastvalue': value});
        });
    });
});

/* Launch the server */
var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});
