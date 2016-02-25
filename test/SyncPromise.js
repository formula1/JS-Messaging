'use strict';

var isPromise = require('is-promise');
var SyncPromise;

module.exports = SyncPromise = function(fn, p){
  var res, rej;
  res = function(value){
    if(this.state) throw new Error('already settled state');
    this.state = 'resolved';
    if(isPromise(value)) return value.then(res, rej);
    this.value = value;
    if(this.next) this.next.run(value);
  }.bind(this);

  rej = function(err){
    if(this.state) throw new Error('already settled state');
    this.state = 'rejected';
    this.value = err;
    if(this.next) this.next.run();
  }.bind(this);

  this.value = void 0;
  this.next = void 0;

  this.run = function(){
    try{
      fn(res, rej);
    }catch(e){
      rej(e);
    }
  };

  if(!p) return this.run();
  if(p.state) return this.run();
  p.next = this;
};

SyncPromise.prototype.then = function(resFn, rejFn){
  var _this = this;

  this.next = new SyncPromise(function(res, rej){
    if(_this.state !== 'rejected') return res(resFn(_this.value));
    if(!rejFn) return rej(_this.value);
    return res(rejFn(_this.value));
  }, this);

  return this.next;
};

SyncPromise.prototype.catch = function(fn){
  var _this = this;
  this.next = new SyncPromise(function(res){
    if(_this.state !== 'resolved') return res(fn(_this.value));
    res(_this.value);
  }, this);

  return this.next;
};

SyncPromise.resolve = function(value){
  if(value.then) return value;
  return new SyncPromise(function(res){
    res(value);
  });
};

SyncPromise.reject = function(value){
  return new SyncPromise(function(res, rej){
    rej(value);
  });
};
