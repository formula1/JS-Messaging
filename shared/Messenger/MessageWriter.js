'use strict';

var EventEmitter = require('events').EventEmitter;
var mutil = require('./message-util');
var MissingMessageError = require('../errors/runtime/MissingMessageError');

/**
	An io listener that sends messages to the functions wanting to handle them.
  @constructor
	@abstract
	@augments EventEmitter
	@param {function} wSendFn - called when a write is issued.
*/
var MessageWriter;
module.exports = MessageWriter = function(wSendFn){

  this._pending = new EventEmitter();

  this._wSendFn = wSendFn;
  this.queue = [];
  this.returnQueue = [];
  this._ready = false;

  // method calls that are sent and waiting an answer
};

MessageWriter.prototype = Object.create(EventEmitter.prototype);
MessageWriter.prototype.constructor = MessageWriter;

/**
	Allows the MessageWriter to know when it can start sending messages
	@function
	@memberof MessageWriter
  @returns {MessageWriter} self
*/
MessageWriter.prototype.ready = function(){
  this._ready = true;
  while(this.queue.length > 0) this._sendMessage(this.queue.shift());
  while(this.returnQueue.length > 0) this._returnMessage(this.returnQueue.shift());
  return this;
};

/**
	Allows the MessageWriter to know when they it can no longer send messages
	@function
	@memberof MessageWriter
  @returns {MessageWriter} self
*/
MessageWriter.prototype.pause = function(){
  this._ready = false;
  return this;
};

/**
	The message to call after you have transformed the data into a readable form
	@function
	@memberof MessageWriter
  @access private
	@param {object} message - An object containing important message information
  @returns {undefined}
*/
MessageWriter.prototype._returnMessage = function(message){
  if(message.method === 'abort') return this.abort(message);
  if(this._pending.listeners(message.id).length == 0)
    throw new Error('non Existant Message');
  if(!this._ready){
    this.returnQueue.push(message);
  }else{
    this._pending.emit(message.id, message.error, message.data);
  }

  return this;
};

/**
	Sends a message to the io without expecting a return
	@function
	@memberof MessageWriter
	@param {string} path - the pathspace you want to process your data
	@param {object} data - the data you want to send them
  @returns {MessageWriter} self
*/
MessageWriter.prototype.trigger = function(path, data){
  var skel = mutil.createSkeleton('trigger', path);
  skel.data = data;
  this._sendMessage(skel);
  return this;
};

/**
  `requestCallback` is what will be called once an io is completed.

  @callback requestCallback
  @param {error} error - an error if one exists
  @param {object} response message - the response that the target gave back
*/

/**
	Sends a message to the io expecting one return value
	@function
	@memberof MessageWriter
	@param {string} path - the path you wish to process your data on
	@param {object} data - the data you want to send them
	@returns {MessagePromise} Returns an abortable Promise
*/
MessageWriter.prototype.request = function(path, data){
  var Request = require('./writer-messages/Request');
  var message = mutil.prepMessage(mutil.createSkeleton('request', path), data);
  return new Request(this, message);
};

/**
  Open a direct connection over a path. This enables multiple sends and multiple recieves.
  @function
  @memberof MessageWriter
  @param {string} path - the path you wish to open up the stream on
  @param {any} data - data you would like to initially send
  @returns {MessageStream} Returns an abortable MessageStream
`*/
MessageWriter.prototype.stream = function(path, data){
  var MessageStream = require('./writer-messages/Stream');
  return new MessageStream(this, path, data);
};

/**
  Open a duplex that may enable more direct routing with a particular route.
	@function
	@memberof MessageWriter
	@param {string} path - the path you want to process your data
	@returns {MessageChildDuplex} Returns a {@link StreamPromise} if no callback is defined
*/
MessageWriter.prototype.duplex = function(path){
  var MessageDuplex = require('./writer-messages/Messenger');
  return new MessageDuplex(this, path);
};

/**
	Abort a Promise, stream, or Duplex
	@function
	@memberof MessageWriter
	@param {WaitingMessage} message - WaitableMessage you wish to abort
	@returns {this} To allow chaining
*/
MessageWriter.prototype.abort = function(message){
  if(!message) throw MissingMessageError(message);
  var id = message.id ? message.id : message;
  if(this.listeners(id).length == 0){
    // this is fine since I would rather have redundancy than none
    return console.warn('already aborted');
  }

  this.removeAllListeners(id);
  var skel = message;
  skel.method = 'abort';
  this._sendMessage(skel);
  return this;
};

MessageWriter.prototype._sendMessage = function(message){
  if(this._ready){
    this._wSendFn(message);
  }else{
    //if there is an error queue it for later when socket connects
    this.queue.push(message);
  }
};
