'use strict';

var Duplex = require('stream').Duplex;
var mutil = require('../message-util');

var MessageStream, write, read;

module.exports = MessageStream = function(parent, path, data){
  Duplex.call(this, {
    objectMode: true,
    readableObjectMode:true,
    writableObjectMode:true,
    write: write.bind(this),
  });
  this.parent = parent;
  this.skel = mutil.createSkeleton('stream', path);
  parent._pending.on(this.skel.id, read.bind(this));
  parent._sendMessage(mutil.prepMessage(this.skel, data));
};

MessageStream.prototype = Object.create(Duplex.prototype);
MessageStream.prototype.constructor = MessageStream;

MessageStream.prototype.abort = function(){
  this.parent.abort(this.message);
  this.push(null);
  this.end();
};

MessageStream.prototype._read = function(){
  return false;
};

write = function(chunk, encoding, next){
  this.parent._sendMessage(mutil.prepMessage(this.skel, chunk));
  next();
};

read = function(error, data){
  if(error) return this.emit('error', error);
  this.push(data);
};
