'use strict';

var Manager = require('../../../shared/Manager');
var WorkerAbstract = require('../WorkerAbstract');
var InternalManager;

module.exports = InternalManager = function(context){
  Manager.call(this, WorkerAbstract);
  context.addEventListener('connect', function(e){
    var workerContext = e.ports[0];
    this.register(workerContext);
    workerContext.start();
  }.bind(this));
};

InternalManager.prototype = Object.create(Manager.prototype);
InternalManager.prototype.constructor = InternalManager;

InternalManager.getSelf = function(){
  return new InternalManager(self);
};
