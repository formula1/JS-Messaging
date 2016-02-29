'use strict';

var MessageRouter = require('./MessageRouter.js');
var MessageWriter = require('./MessageWriter.js');
var EventEmitter = require('events').EventEmitter;
var genRandom = require('../random');

/**
  An io listener that can also write messages.
  @constructor
  @interface
  @augments MessageRouter
  @augments MessageWriter
  @param
    - {function} writwFn - called when by this to write a message
    - {function} [readFn=writeFn] - called when by this to return a message
*/

var MessageDuplex;
module.exports = MessageDuplex = function(wSendFn, rSendFn){
  if(!rSendFn) rSendFn = wSendFn;
  if(typeof wSendFn == 'undefined') throw new Error('Need at least 1 function');
  var _writeFn = wSendFn;
  this.originator = genRandom();
  var _this = this;
  wSendFn = function(message){
    if(message.originator){
      if(!Array.isArray(message.originator)){
        throw new Error('something went wrong in the originator chain');
      }

      message.originator.push(_this.originator);
    }else{
      message.originator = [_this.originator];
    }

    _writeFn(message);
  };

  MessageRouter.call(this, rSendFn);
  MessageWriter.call(this, wSendFn);
  EventEmitter.call(this);
};

MessageDuplex.prototype = Object.create(MessageWriter.prototype);
var key;
for(key in MessageRouter.prototype){
  if(key in MessageDuplex.prototype){
    console.warn(key, 'interferes with other functions');
    continue;
  }

  MessageDuplex.prototype[key] = MessageRouter.prototype[key];
}

for(key in EventEmitter.prototype){
  if(key in MessageDuplex.prototype){
    console.warn(key, 'interferes with other functions');
    continue;
  }

  MessageDuplex.prototype[key] = EventEmitter.prototype[key];
}

/**
  The method to call after you have processed the message the io has recieved.
  @memberof MessageDuplex
  @access private
  @param {object} message - An object containing important message information
  @param {object} user - the user you want to recieve in the {@link MessageRouter#rSendFn}
  @returns {undefined}
*/
MessageDuplex.prototype._handleMessage = function(message, user){
  console.log(message.originator);
  if(message.originator.indexOf(this.originator) != -1){
    console.log('return');
    this._returnMessage(message);
  }else{
    console.log('route');
    this.route(message, user);
  }
};

MessageDuplex.prototype.ready = function(){
  this.emit('ready');
  MessageWriter.prototype.ready.apply(this, arguments);
};

MessageDuplex.prototype.pause = function(){
  this.emit('pause');
  MessageWriter.prototype.pause.apply(this, arguments);
};

MessageDuplex.prototype.destroy = function(){
  this.emit('destroy');
};

MessageDuplex.prototype.constructor = MessageDuplex;
