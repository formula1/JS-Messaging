'use strict';

var Duplex = require('stream').Duplex;
var mutil = require('../message-util');

var MessageStream, write, read;

module.exports = MessageStream = function(parent, path){
  this.parent = parent;
  this.skel = mutil.createSkeleton('stream', path);
  Duplex.call(this, {
    readableObjectMode:true,
    write: write.bind(this),
  });
  parent.on(this.skel.id, read.bind(this));
  parent._sendMessage(mutil.prepMessage(this.skel));
  this.skel.type = 'proxy';
};

MessageStream.prototype = Object.create(Duplex.prototype);
MessageStream.prototype.constructor = MessageStream;

MessageStream.prototype.abort = function(){
  this.parent.abort(this);
  this.push(null);
  this.emit('close');
};

write = function(chunk, encoding, next){
  this.parent._sendMessage(mutil.prepMessage(this.skel, chunk));
  next();
};

read = function(error, data){
  if(error) return this.emit('error', error);
  this.push(data);
};
