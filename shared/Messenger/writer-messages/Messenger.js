'use strict';

var Duplex = require('../MessageDuplex');
var mutil = require('../message-util');

var MessageChildDuplex, read, write;

module.exports = MessageChildDuplex = function(parent, path){
  this.parent = parent;
  this.skel = mutil.createSkeleton('messenger', path);
  Duplex.call(this, write.bind(this));
  parent.on(this.skel.id, read.bind(this));
  parent._sendMessage(mutil.prepMessage(this.skel));
  this.skel.type = 'proxy';
};

read = function(error, sMessage){
  if(error) return this.emit('error', error);
  this.handleMessage(sMessage);
};

write = function(data){
  this.parent._sendMessage(mutil.prepMessage(this.skel, data));
};

MessageChildDuplex.prototype = Object.create(Duplex);
MessageChildDuplex.prototype.constructor = MessageChildDuplex;

MessageChildDuplex.prototype.abort = function(){
  this.parent.abort(this);
};
