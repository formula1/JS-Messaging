'use strict';

var MessageDuplex = require('../../shared/Messenger/MessageDuplex');
var websocket = require('websocket-driver');

function Client(config, socket){
  var _this = this;
  if(!config.request){
    this.config = config = Client.parseFromRequest(config);
  }else{
    this.config = config = Client.parseFromImport(config);
  }

  this.socket = socket;

  socket.on('error', function(e){
    console.log(e);
    if(e.message == 'write ECONNRESET'){
      return _this.close();
    }

    _this.emit('error', e);
  });

  socket.on('close', this.close.bind(this));
  this.driver = websocket.http(config.request, config.options);
  MessageDuplex.call(this, function(message){
    _this.driver.text(JSON.stringify(message));
  });

  this.driver.on('open', function(){
    _this.config.handShake = true;
    _this.ready();
  });

  this.driver.on('message', function(event){
    try{
      _this._handleMessage(JSON.parse(event.data));
    }catch(e){
      _this.emit('error', e);
    }
  });

  this.driver.on('error', this.emit.bind(this, 'error'));
  this.driver.on('close', this.destroy.bind(this));
  socket.pipe(this.driver.io).pipe(socket);
  if(config.readyState === -1){
    if(config.body){
      this.driver.io.write(config.body);
      delete this.config.body;
    }

    this.driver.start();
  }else{
    this.driver.readyState = config.readyState;
    _this.ready();
  }
}

Client.prototype = Object.create(MessageDuplex.prototype);
Client.prototype.constructor = Client;

Client.prototype.close = function(){
  this.stop();
  this.socket.destroy();
  this.driver.close();
  this.emit('close');
};

Client.prototype.export = function(){
  this.stop();
  this.socket.pause();
  this.socket.unpipe(this.driver.io);
  this.driver.io.unpipe(this.socket);
  this.config.readyState = this.driver.readyState;
  return [this.config, this.socket];
};

Client.import = function(config, socket){
  return new Client(config, socket);
};

Client.parseFromRequest = function(req){
  var config = {};
  config.body = req.body;
  if(req.user){
    config.user = req.user;
    delete req.user;
  }else{
    config.user = 'anonymous';
  }

  config.handshake = false;
  config.readyState = -1;
  config.request = req;
  return config;
};

Client.parseFromImport = function(config){
  config.handShake = !!config.handShake;
  if(!this.config.handShake) config.readyState = -1;
  return config;
};

module.exports = Client;
