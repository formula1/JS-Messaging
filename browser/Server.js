'use strict';

var MessageDuplex = require('../shared/Messenger/MessageDuplex');
var url = require('url');
var Server;

module.exports = Server = function(uri, socket){
  var _this = this;
  var docuri = url.parse(window.location.href);
  if(!uri){
    uri = '';
  }

  if(typeof uri === 'object'){
    uri = uri.format(uri); //for error checking
  }

  if(typeof uri === 'string'){
    this.url = url.parse(uri);
    if(!this.url.host) this.url.host = docuri.host;
    if(!this.url.port) this.url.port = docuri.port;
    if(!this.url.pathname) this.url.pathname = docuri.pathname;
    if(!this.url.pass) this.url.pass = docuri.pass;
    this.url.protocol = 'ws:';
  }else{
    throw new Error('Url can only be a string or object');
  }

  if(!socket){
    try{
      console.log(url.format(this.url));
      this.socket = new WebSocket(url.format(this.url));
    }catch(exception){
      console.error(exception);
      return;
    }
  }else{
    this.socket = socket;
  }

  this.socket.onopen = this.ready.bind(this);
  this.socket.onmessage = function(message){
    try{
      _this.handleMessage(JSON.parse(message.data));
    }catch(e){
      _this.emit('error', e);
    }
  };

  this.socket.addEventListener('close', this.stop.bind(this));
  this.socket.addEventListener('error', this.emit.bind(this, 'error'));

  MessageDuplex.call(this, function(message){
    _this.socket.send(JSON.stringify(message));
  });
};

Server.prototype = Object.create(MessageDuplex.prototype);
Server.prototype.constructor = Server;

Server.prototype.close = function(){
  this.socket.close();
};

Server.prototype.export = function(){
  this.stop();
  var socket = this.socket;
  socket.onopen = void 0;
  socket.onmessage = void 0;
  socket.onclose = void 0;
  return [this.url, this.socket];
};

Server.import = function(uri, socket){
  return new Server(uri, socket);
};

module.exports = Server;
