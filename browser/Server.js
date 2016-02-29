'use strict';

var MessageDuplex = require('../shared/Messenger/MessageDuplex');
var WebSocket = require('websocket').w3cwebsocket;
var url = require('url');
var Server, ensureSocket;

module.exports = Server = function(socket){
  var _this = this;
  try{
    socket = ensureSocket(socket);
  }catch(exception){
    console.error(exception);
    throw exception;
  }

  MessageDuplex.call(this, function(message){
    _this.socket.send(JSON.stringify(message));
  });

  this.pause();

  socket.onopen = this.ready.bind(this);
  socket.onmessage = function(message){
    try{
      _this._handleMessage(JSON.parse(message.data));
    }catch(e){
      _this.emit('error', e);
    }
  };

  socket.addEventListener('close', this.destroy.bind(this));
  socket.addEventListener('error', this.emit.bind(this, 'error'));

  this.socket = socket;

  this.on('destroy', socket.close.bind(socket));
};

Server.prototype = Object.create(MessageDuplex.prototype);
Server.prototype.constructor = Server;

Server.prototype.export = function(){
  this.pause();
  var socket = this.socket;
  socket.onopen = void 0;
  socket.onmessage = void 0;
  socket.onclose = void 0;
  return [this.url, this.socket];
};

Server.import = function(uri, socket){
  return new Server(uri, socket);
};

ensureSocket = function(uri_or_socket){
  if(uri_or_socket instanceof WebSocket){
    return uri_or_socket;
  }

  var uri = uri_or_socket;
  if(typeof uri === 'string') uri = url.parse(uri);
  if(typeof uri === 'object') uri = url.format(uri);
  else throw new Error('Cannot handle this argument');

  return new WebSocket(uri);
};
