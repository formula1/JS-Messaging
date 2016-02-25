'use strict';

var MessageRouter = require('./MessageRouter.js');
var MessageWriter = require('./MessageWriter.js');
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
  this.rSendFn = this.rSendFn;
  MessageWriter.call(this, wSendFn);
  this.wSendFn = this.wSendFn;
};

MessageDuplex.prototype = Object.create(MessageWriter.prototype);
for(var i in MessageRouter.prototype){
  if(i === 'constructor') continue;
  if(i in MessageDuplex.prototype){
    console.warn(i, 'interferes with other functions');
    continue;
  }

  MessageDuplex.prototype[i] = MessageRouter.prototype[i];
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

MessageDuplex.prototype.constructor = MessageDuplex;
