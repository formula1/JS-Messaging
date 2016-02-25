'use strict';

// var StreamDuplex = require('stream').Duplex;

module.exports = function(at, MessageWriter){
  if(!MessageWriter) MessageWriter = require('../../shared/Messenger/MessageWriter');
  at.plan(0);
  at.comment('Message Writer can write events');

  at.comment('Message Writer can make requests');

  at.comment('Message Writer can open up streams to a router');

  at.comment('Message Writer can open up a duplex to the router');
};
