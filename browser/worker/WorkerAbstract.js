'use strict';

var MessageDuplex = require('../../shared/Messenger/MessageDuplex');

var WorkerAbstract, consumeMessage;

module.exports = WorkerAbstract = function(context){
  if(typeof context === 'undefined'){
    throw new Error('A Worker Is needed');
  }

  MessageDuplex.call(this, context.postMessage.bind(context));
  context.addEventListener('message', consumeMessage.bind(this));
  this.ready();

  return this;
};

consumeMessage = function(e){
  this.handleMessage(e.data[0]);
};

WorkerAbstract.prototype = Object.create(MessageDuplex.prototype);
WorkerAbstract.prototype.constructor = WorkerAbstract;

WorkerAbstract.getSelf = function(){
  return new WorkerAbstract(self);
};
