'use strict';

var mutil = require('../../../shared/Messenger/message-util.js');

module.exports = function(at, MessageRouter, MessageWriter){
  if(!MessageRouter) MessageRouter = require('../../../shared/Messenger/MessageRouter');
  if(!MessageWriter) MessageWriter = require('../../../shared/Messenger/MessageWriter');

  at.test('Router can read messages sent from writer', function(t){
    var expectedSend = Math.random();
    var expectedReturn = Math.random();
    var sentValue = [];
    var writer = new MessageWriter(function(value){
      sentValue.push(value);
    });

    writer.ready();

    var backValue = [];
    var router = new MessageRouter(function(value){
      backValue.push(value);
    });

    t.equal(sentValue.length, 0, 'nothing has been written');
    t.equal(backValue.length, 0, 'nothing has been sent back');

    var routed = false;
    router.onRequest(/a\/path/, function(message, responder){
      routed = true;
      t.equal(message, expectedSend, 'Recieved the correct value');
      t.ok(responder, 'Responses should be available for requests');
      responder.resolve(expectedReturn);
      throw 'stop';
    });

    t.notOk(routed, 'nothing has been routed');

    var p = writer.request('a/path', expectedSend);

    t.equal(sentValue.length, 1, 'We no have something to send to the router');
    t.equal(sentValue[0].data, expectedSend, 'Sending the correct value');
    t.equal(backValue.length, 0, 'nothing has been sent back');

    router.route(sentValue[0]).catch(function(err){
      t.threw(err);
    });

    t.equal(sentValue.length, 1, 'No additional writes have been made');
    t.equal(backValue.length, 1, 'Router has sent something back');
    t.equal(backValue[0].data, expectedReturn, 'Sending the correct value');

    var returnedValue = [];
    p.then(function(ret){
      console.log('ret push', ret);
      returnedValue.push(ret);
    }).catch(function(err){
      t.threw(err);
    });

    writer._returnMessage(backValue[0]);
    console.log('after push', returnedValue);
    t.equal(sentValue.length, 1, 'No additional writes have been made');
    t.equal(backValue.length, 1, 'No additional router returns have been made');
    t.equal(returnedValue.length, 1, 'nothing has been returned');
    t.equal(returnedValue[0], expectedReturn, 'Recieved Back the Correct Data');
    t.end();
  });

  at.end();
};
