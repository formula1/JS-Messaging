'use strict';

var WorkerAbstract = require('./WorkerAbstract');

var DedicatedWorker;

module.exports = DedicatedWorker = function(url){
  var context = new WorkerAbstract(new Worker(url));
  WorkerAbstract.call(this, context);
  this.ready();
};

DedicatedWorker.prototype = Object.create(WorkerAbstract.prototype);
DedicatedWorker.prototype.constructor = DedicatedWorker;
