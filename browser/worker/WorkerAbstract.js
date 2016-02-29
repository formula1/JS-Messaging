'use strict';

var MessageDuplex = require('../../shared/Messenger/MessageDuplex');

var WorkerAbstract;

module.exports = WorkerAbstract = function(context){
  if(typeof context === 'undefined'){
    throw new Error('A Worker Is needed');
  }

  var _this = this;

  MessageDuplex.call(this, context.postMessage.bind(context));
  context.addEventListener('message', function(e){
    _this.handleMessage(e.data[0]);
  });

  this.ready();

  return this;
};

WorkerAbstract.prototype = Object.create(MessageDuplex.prototype);
WorkerAbstract.prototype.constructor = WorkerAbstract;

WorkerAbstract.getSelf = function(){
  return new WorkerAbstract(self);
};
