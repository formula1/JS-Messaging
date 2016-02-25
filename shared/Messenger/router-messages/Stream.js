'use strict';

var Duplex = require('stream').Duplex;
var mutil = require('../message-util');
var MessageStream, write, read;

module.exports = MessageStream = function(parent, message){
  Duplex.call(this, {
    objectMode: true,
    readableObjectMode:true,
    writableObjectMode:true,
    write: write.bind(this),
  });
  this.parent = parent;
  this.skel = message;
  parent._proxies.on(this.skel.id, read.bind(this));
  this.on('finished', this.abort.bind(this));
};

MessageStream.prototype = Object.create(Duplex.prototype);
MessageStream.prototype.constructor = MessageStream;

MessageStream.prototype.abort = function(){
  this.parent._proxies.removeAllListeners(this.skel.id);
  this.parent._rSendFn({
    method: 'abort',
    id: this.skel.id,
  });

  this.push(null);
  this.end();
};

MessageStream.prototype._read = function(){
  return false;
};

write = function(chunk, encoding, next){
  var ret = mutil.prepMessage(this.skel, chunk);
  this.parent._rSendFn(ret);
  next();
};

read = function(message){
  if(message === 'abort') return this.abort();
  this.push(message.data);
};
