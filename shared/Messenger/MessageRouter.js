'use strict';

var EventEmitter = require('events').EventEmitter;
var MissingRouteError = require('../errors/runtime/MissingRouteError');

// var UnrecognizedMessageMethod = require('../errors/runtime/UnrecognizedMessageMethod');
var AbstractMethodError = require('../errors/compilation/AbstractMethodError');
var pathToRegexp = require('path-to-regexp');

/**
  An io listener that sends messages to the functions wanting to handle them.
  @constructor
  @interface
  @augments EventEmitter
  @param
    {function} rSendFn - called when this wants return a message {@link MessageRouter#rSendFn}.
*/

var MessageRouter;

module.exports = MessageRouter = function(rSendFn){
  if(typeof rSendFn !== 'function')
    throw new AbstractMethodError('Need a manner to send back');
  this._routes = [];
  this._proxies = new EventEmitter();
  this._returns = new EventEmitter();
  this._rSendFn = rSendFn;
};

MessageRouter.prototype.onEvent = function(path, fn){
  if(typeof path === 'string') path = pathToRegexp(path);
  this._routes.push({ method:'trigger', path:path, fn:fn });
};

MessageRouter.prototype.onRequest = function(path, fn){
  if(typeof path === 'string') path = pathToRegexp(path);
  this._routes.push({ method:'request', path:path, fn:fn });
};

MessageRouter.prototype.onStream = function(path, fn){
  if(typeof path === 'string') path = pathToRegexp(path);
  this._routes.push({ method:'stream', path:path, fn:fn });
};

MessageRouter.prototype.onMessenger = function(path, fn){
  if(typeof path === 'string') path = pathToRegexp(path);
  this._routes.push({ method:'messenger', path:path, fn:fn });
};

MessageRouter.prototype.use = function(path, fn){
  if(typeof path === 'function'){
    fn = path;
    path = /.*/;
  }

  this._routes.push({ method:'any', path:path, fn:fn });
};

var createResponder;
MessageRouter.prototype.route = function(message){
  if(message.method === 'abort'){
    if(!(message.id in this._proxies)){
      // we are all clean, no errors necessary
      console.warn('already aborted', message.id);
    }

    this._proxies.emit(message.id, 'abort');
    return;
  }

  if(message.method === 'stream'){
    // Might want to check if a particular ID had been aborted
    // This can be done much cleaner if we tell the otherside what ID to use (based off timestamp)
    // in this manner they can never use old IDs.
    if(this._proxies.listeners(message.id).length){
      return this._proxies.emit(message.id, message);
    }
  }

  /*
    TODO: Handle Abort logic during routing
  */

  var responder = createResponder.call(this, message);

  return this._routes.reduce(function(p, route){
    if(route.method !== message.method && route.method !== 'any') return p;
    var matches = route.path.exec(message.path);
    if(!matches) return p;
    return p.then(function(){
      return route.fn(message.data, responder);
    }).then(function(){
      if(responder && responder.ended) throw 'stop';
    });
  }, Promise.resolve()).then(function(){
    if(message.method !== 'trigger') throw new MissingRouteError(message);
  }).catch(function(err){
    if(err === 'stop') return;
    message.error = err;
    delete this._proxies[message.id];
    this._rSendFn(message);
    throw err;
  }.bind(this));
};

createResponder = function(message){
  var Messenger = require('./router-messages/Messenger');
  var Stream = require('./router-messages/Stream');
  var Response = require('./router-messages/Response');
  switch(message.method){
    case 'messenger': return new Messenger(this, message);
    case 'stream' : return new Stream(this, message);
    case 'request': return new Response(this, message);
    default: return void 0;
  }
};
