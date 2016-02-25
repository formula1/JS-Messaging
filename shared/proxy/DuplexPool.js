'use strict';
var EventEmitter = require('events').EventEmitter;
var async = require('async');

var DuplexPool;
module.exports = DuplexPool = function(clients){
  this.clients = clients = [];
  var _this = this;
  clients.forEach(function(client){
    client.on('error', function(e){
      _this.emit('client-error', e, client);
    });

    client.on('close', function(){
      var i = clients.indexOf(client);
      clients.splice(i, 1);
      _this.emit('client-close', client);
    });
  });

  this.lag = 0;
};

DuplexPool.prototype = Object.create(EventEmitter.prototype);
DuplexPool.prototype.constructor = DuplexPool;

DuplexPool.prototype.addClient = function(client){
  for(var i = 0; i < this.clients.length; i++){
    if(this.clients[i].id == client.id){
      this.clients[i] = client;
      return this.emit('re-enter', client);
    }
  }

  var player;

  if(!player){
    console.log('this is not a player I want');
    return client.close();
  }

  player.open(client);
  var _this = this;
  player.ntp(function(err){
    if(err){
      console.log(err);
      player.trigger('reopen');
      player.close(client);
      return;
    }

    console.log('after ntp');
    _this.lag = Math.max(player.lag, _this.lag);
    player.me(function(meErr){
      if(meErr){
        console.log(meErr);
        return player.close(client);
      }

      _this.emit('player-join', player);
      _this.initialize();
    });
  });
};

DuplexPool.prototype.initialize = function(){
  if(this._state !== DuplexPool.UNSTARTED) return;

  console.log('initializing');
  this._state = DuplexPool.STARTING;
  var l = this.players.length;
  while(l--){
    if(!this.players[l].isOnline){
      console.log(this.players[l].isOnline);
      this._state = DuplexPool.UNSTARTED;
      console.log('a player is not online init right now');
      return;
    }

    if(!this.players[l].lag){
      console.log(this.players[l].lag);
      this._state = DuplexPool.UNSTARTED;
      console.log('a player\'s npt has not been completed');
      return;
    }
  }

  this._state = DuplexPool.STARTED;
  this.emit('start');
};

DuplexPool.prototype.syncCast = function(event, data){
  var l = this.players.length;
  while(l--){
    this.players[l].trigger(event, data);
  }
};

DuplexPool.prototype.syncGet = function(event, data, next){
  if(typeof data === 'function'){
    next = data;
    data = void 0;
  }

  async.each(this.players,
    function(item, iNext){
      item.get(event, data, iNext);
    }, next
  );
};

DuplexPool.prototype.lagCast = function(event, data, next){
  if(typeof data === 'function'){
    next = data;
    data = void 0;
  }

  var l = this.players.length;
  while(l--){
    setTimeout(
      this.players[l].trigger.bind(this.players[l], event, data),
      this.lag - this.players[l].lag
    );
  }

  setTimeout(next, this.lag + 1);
};

DuplexPool.prototype.lagGet = function(event, data, next){
  if(typeof data === 'function'){
    next = data;
    data = void 0;
  }

  var lag = this.lag;
  async.each(this.players,
    function(item, iNext){
      setTimeout(item.get.bind(item, event, data, iNext), lag - item.lag);
    }, next
  );
};

DuplexPool.prototype.end = function(){
  this._state = DuplexPool.ENDING;
  var l = this.players.length;
  while(l--){
    this.players[l].removeAllListeners();
    this.players[l].exit();
  }

  this.emit('end', this);
  this._state = DuplexPool.ENDED;
};

DuplexPool.UNSTARTED = -1;
DuplexPool.STARTING = 0;
DuplexPool.STARTED = 1;
DuplexPool.ENDING = 2;
DuplexPool.ENDED = 3;
