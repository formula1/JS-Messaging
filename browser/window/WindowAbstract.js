'use strict';

var MessageDuplex = require('../../shared/Messenger/MessageDuplex');
var WinAbs;
module.exports = WinAbs = function(context, origin){

  this.origin = origin = origin ? origin : '*';
  MessageDuplex.call(this, function(message){
    context.postMessage(message, origin);
  });

  this.context = context;
  window.addEventListener('message', function(message){
    if(message.source != context) return;
    message = message.data;
    this.handleMessage(message);
  }.bind(this));

  return this;
};

WinAbs.prototype = Object.create(MessageDuplex.prototype);
WinAbs.prototype.constructor = WinAbs;

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
