'use strict';

var Duplex = require('../MessageDuplex');
var mutil = require('../message-util');

var MessageChildDuplex, read, write;

module.exports = MessageChildDuplex = function(parent, message){
  Duplex.call(this, write.bind(this));
  this.skel = Object.create(message);
  parent._proxies.on(this.skel.id, read.bind(this));
};

read = function(message){
  if(message == 'abort'){
    return this.abort();
  }

  this.handleMessage(message.data);
};

write = function(message){
  parent._rSendFn(mutil.prepMessage(this.skel, message));
};

MessageChildDuplex.prototype = Object.create(Duplex);
MessageChildDuplex.prototype.constructor = MessageChildDuplex;

MessageChildDuplex.prototype.abort = function(){
  this.parent.abort(this);
};
