var fs = require('fs');
var http = require('http');
var redis = require('redis-url').connect(process.env.REDISTOGO_URL);
var pusher = require('pusher-url').connect(process.env.PUSHER_URL);

var express = require('express');
var app = express();

app.use (function(req, res, next) {
    if ('content-type' in req.headers && req.headers['content-type'].substr(0,5) == 'text/') {
        var data='';
        req.setEncoding('utf8');
        req.on('data', function(chunk) {
           data += chunk;
        });

        req.on('end', function() {
            req.body = data;
            next();
        });
    } else next();
});
app.use(express.bodyParser());


/* Serve the JS client */
app.get('/client.js', function(req, res) {
    fs.readFile('./clients/js/radiate.js', function (err, input) {
        if (err) throw err;
        res.set('Content-Type', 'application/javascript');
        output = input.toString().replace('__RADIATE_SERVER__', req.protocol + '://' + req.get('Host')).replace('__PUSHER_KEY__', pusher.options.key);
        res.send(output);
    });
});


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


/* "Home page" */
app.get('/', function(req, res) {
    res.json('Radiate is ready.');
});


/* Getting data */
function getData(key, field, callback) {
    if (typeof field == 'function') {
        callback = field;
        field = null;
    }
    redis.type(key, function(err, type) {
        if (type == 'string') {
            redis.get(key, callback);
        } else if (type == 'hash') {
            if (field) {
                redis.hget(key, field, callback);
            } else {
                redis.hgetall(key, callback);
            }
        } else if (type == 'none') {
            callback('key not found');
        }
    });
}

app.get('/:key/:field?', function(req, res) {
    getData(req.params.key, req.params.field, function(err, value) {
        if (err) {
            res.json(404, {'error': 'Not found'});
        } else {
            res.json({'value': value});
        }
    });
});


/* Setting and manipulating data */
app.put('/:key', function(req, res) {
    var key = req.params.key;

    var callback = function(err) {
        if (err) {
            res.json(500, {'error': err});
        } else {
            getData(key, function(err, value) {
                res.json({'value': value});
                pusher.trigger('updates', 'update:' + key, {'value': value});
            });
        }
    };

    if (typeof req.body == 'string') {
        var input = req.body;
        redis.set(key, input, callback);
    } else if (typeof req.body == 'object') {
        if ('_value' in req.body) {
            var input = req.body._value;
            if (typeof input != 'string') input = JSON.stringify(input);
            redis.set(key, input, callback);
        } else if ('_action' in req.body) {
            var action = req.body._action.toUpperCase();
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
                res.json(500, {'error': 'Unknown action'});
            }
        } else {
            var fields = {};
            for (var field in req.body) {
                if (req.body.hasOwnProperty(field)) {
                    if (typeof req.body[field] == 'string') {
                        fields[field] = req.body[field];
                    } else {
                        fields[field] = JSON.stringify(req.body[field]);
                    }
                }
            }
            redis.hmset(key, fields, callback);
        }
    } else {
        res.json(500, {'error': 'Unsupported type of input'});
    }
});


/* Deleting data */
app.delete('/:key', function(req, res) {
    var key = req.params.key;
    redis.get(key, function(err, value) {
        redis.del(key, function(err, deleted) {
            res.json({'deleted': deleted});
            if (deleted) {
                pusher.trigger('updates', 'update:' + key, {'value': null});
                pusher.trigger('deletes', 'delete:' + key, {'deleted': deleted, 'lastvalue': value});
            }
        });
    });
});


/* Launch the server */
var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});
