'use strict';

var WorkerAbstract = require('../WorkerAbstract');

var SharedWorker;

module.exports = SharedWorker = function(url){
  var context = new SharedWorker(url);
  context.port.start();
  WorkerAbstract.call(this, context.port);
  this.ready();

  return this;
};

SharedWorker.prototype = Object.create(WorkerAbstract.prototype);
SharedWorker.prototype.constructor = SharedWorker;
