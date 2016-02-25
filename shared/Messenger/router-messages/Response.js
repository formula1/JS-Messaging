'use strict';

var MessagePromise, abortHandler;

module.exports = MessagePromise = function(parent, message){
  this.skel = message;
  parent._proxies.once(this.skel.id, abortHandler.bind(this));
  this.parent = parent;
  this.finished = false;
};

MessagePromise.prototype = Object.create(Promise.prototype);

MessagePromise.prototype.abort = function(){
  this.skel.type = 'abort';
  this.reject(new Error('Aborted'));
};

MessagePromise.prototype.push = function(){
  this.reject(new Error('not expecting more data'));
};

MessagePromise.prototype.resolve = function(data){
  this.finished = true;
  this.skel.data = data;
  this.parent._rSendFn(this.skel);
  this.parent._proxies.removeAllListeners(this.skel.id);
};

MessagePromise.prototype.reject = function(error){
  this.finished = true;
  this.skel.error = error;
  this.parent._rSendFn(this.skel);
  this.parent._proxies.removeAllListeners(this.skel.id);
};

abortHandler = function(message){
  if(message === 'abort'){
    this.skel.type = 'abort';
    this.reject(new Error('Aborted'));
  }
};
