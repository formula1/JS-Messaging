'use strict';

var Server = require('../Server');
var NetworkInstance = require('./Client.js');

function ClientHost(uri, socket, config, sconfig){
  Server.call(this, uri, socket);
  this.connections = {};
  this.config = config || { iceServers: [
    { url:'stun:stun.l.google.com:19302' },

//    {url: 'stun:'+this.uri.hostname+':3478'},
  ], };

  this.sconfig = sconfig || {};
  var _this = this;
  this.user = void 0;
  this
  .add('offer', this.emit.bind(this, 'offer'))
  .add('accept', function(data){
    if(!_this.connections[data.target._id])
      return console.log('accepting a gift ungiven');
    _this.connections[data.target._id].ok(data);
    _this.emit('handshake', _this.connections[data.target._id]);
  }).add('ice', function(data){
    _this.connections[data.sender._id].remoteIce(data.ice);
  }).get('me', function(me){
    _this.user = me;
  });

  return this;
}

ClientHost.prototype = Object.create(Server.prototype);
ClientHost.prototype.constructor = ClientHost;

ClientHost.prototype.closeAll = function(){
  for(var i in this.connections)
    this.connections[i].close();
};

ClientHost.prototype.offer = function(user){
  var _this = this;
  var id = user._id;
  var conn;
  return Promise.resolve().then(function(){
    conn = _this.connections[id] = new NetworkInstance(this, user);
    conn.on('open', _this.emit.bind(_this, 'connection'));

    conn.on('close', function(){
      delete _this.connections[id];
    });

    conn.id = id;
    return conn.offer();
  }).then(function(){
    _this.emit('new-offer', conn);
    return conn;
  });
};

ClientHost.prototype.accept = function(message){
  var _this = this;
  var id = message.sender._id;
  var conn;
  return Promise.resolve().then(function(){
    conn = _this.connections[id] = new NetworkInstance(_this, message.sender);
    console.log('new network instance');
    conn.id = id;
    conn.on('open', _this.emit.bind(_this, 'connection'));
    conn.on('close', function(){
      delete _this.connections[id];
    });

    return conn.accept(message);
  }).then(function(){
    _this.emit('new-accept', conn);
    return conn;
  });
};

ClientHost.prototype.ok = function(message){
  return this.connections[message.sender._id].ok(message);
};

module.exports = ClientHost;
