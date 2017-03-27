var sauceConnect = require("sauce-connect-launcher");

module.exports.start = function(sauceConfig, cb){
  var id = "tunnel_" + Date.now().toString(32);
  sauceConnect({
    username: sauceConfig.sauce_username,
    accessKey: sauceConfig.sauce_key,
    tunnelIdentifier: id,
  }, function(err, tunnel){
    if(err){
      return cb(err);
    }
    tunnel.id = id;
    cb(void 0, tunnel);
  });
};

module.exports.end = function(tunnel, cb){
  tunnel.close(cb);
};

if(!module.parent){
  var mapping = {
    SAUCE_USERNAME: "sauce_username",
    SAUCE_ACCESS_KEY: "sauce_key",
  };

  var config = require("./config")(mapping);
  module.exports.start(config, function(err /* tunnel */){
    if(err) throw err;

    // console.log("tunnel started: ", tunnel.id);
  });
}
