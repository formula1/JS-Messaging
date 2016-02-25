'use strict';

var EventEmitter = require('events').EventEmitter;

var Manager, errList, donList;

module.exports = Manager = function(WorkerClass, configs){
  if(!WorkerClass){
    throw new Error('Managers Require a Worker Class');
  }

  this._WorkerClass = WorkerClass;
  EventEmitter.call(this);
  this.configs = [];
  this.workers = {};
  if(configs)
    setImmediate(this.load.bind(this, configs));
};

Manager.prototype = Object.create(EventEmitter.prototype);
Manager.prototype.constructor = Manager;

Manager.prototype.load = function(configs){
  configs.forEach(this.register.bind(this));
  return this;
};

errList = function(p, error){
  p._watchedWorker.removeListener('ready', p._donList);
  p.reject(error);
};

donList = function(p){
  p._watchedWorker.removeListener('error', p._errList);
  p.resolve(p._watchedWorker);
};

Manager.prototype.register = function(config){
  var worker;
  var p = new Promise();
  if(config.id in this.workers){
    //we do not have a fresh worker. Either a replacement or the same one
    if(config == this.workers[config.id]){
      // if its exactly the same, we don't have to worry
      return p.resolve(config);
    }

    if(config instanceof this._WorkerClass){
      // if its not, this is a situation where it may be a hacker or a replacement
      p.reject(new Error('registering a worker with the same ID'));
    }

    worker = new this._WorkerClass(this, config);
  }else{
    if(config instanceof this._WorkerClass){
      worker = config;
    }else{
      worker = new this._WorkerClass(this, config);
    }
  }

  this.workers[worker.id] = worker;
  this.configs.push(worker.config);
  p._watchedWorker = worker;
  p._errList = errList.bind(void 0, p);
  p._donList = donList.bind(void 0, p);
  worker.once('ready', p._donList);
  worker.once('error', p._errList);

  return p;
};

Manager.prototype.broadcast = function(path, data){
  for(var i in this.workers){
    this.workers[i].trigger(path, data);
  }
};

module.exports = Manager;
