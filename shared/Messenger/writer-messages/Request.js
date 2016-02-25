'use strict';

var mutil = require('../message-util');
var MessagePromise, callback;

module.exports = MessagePromise = function(parent, path, data){
  Promise.call(this);
  this.parent = parent;
  this.skel = mutil.createSkeleton('request', path);
  parent.once(this.skel.id, callback.bind(this));
  parent._sendMessage(mutil.prepMessage(this.skel, data));
};

MessagePromise.prototype = Object.create(Promise.prototype);
MessagePromise.prototype.constructor = MessagePromise;

MessagePromise.prototype.abort = function(){
  this.parent.abort(this);
  this.reject(new Error('Aborted'));
};

callback = function(error, data){
  if(error) return this.reject(error);
  this.resolve(data);
};
