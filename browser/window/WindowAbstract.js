'use strict';

var MessageDuplex = require('../../shared/Messenger/MessageDuplex');
var WinAbs;
module.exports = WinAbs = function(context, origin){

  this.origin = origin ? origin : '*';
  MessageDuplex.call(this, function(message){
    message.user = null;
    this.context.postMessage(message, this.origin);
  }.bind(this));

  this.context = context;
  window.addEventListener('message', this.handleMessage.bind(this));
  this.ready();
  return this;
};

WinAbs.prototype = Object.create(MessageDuplex.prototype);
WinAbs.prototype.constructor = WinAbs;

WinAbs.prototype.handleMessage = function(message){
  if(message.source != this.context) return;
  message = message.data;
  MessageDuplex.prototype.handleMessage.call(this, message, this.context);
};

WinAbs.getParent = function(){
  if(window.parent && window.parent != window){
    return new WinAbs(window.parent);
  }

  throw new Error('there is no parent to this window');
};

WinAbs.getTop = function(){
  if(window.top != window.parent)
    return new WinAbs(window.top);
  throw new Error('this parent has no parent');
};

WinAbs.getOpener = function(){
  return new WinAbs(window.opener);
};

WinAbs.fromIFrame = function(iframe){
  return new WinAbs(iframe.contentWindow);
};
