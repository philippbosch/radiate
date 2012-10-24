var url = require('url');

module.exports.createClient = module.exports.connect = function(pusher_url) {
  var parsed_url  = url.parse(pusher_url || process.env.PUSHER_URL);
  var parsed_auth = parsed_url.auth.split(':');
  var parsed_path = parsed_url.path.split('/');

  var Pusher = require('node-pusher');
  var pusher = new Pusher({
    appId: parsed_path[parsed_path.length-1],
    key: parsed_auth[0],
    secret: parsed_auth[1]
  });

  return(pusher);
}
