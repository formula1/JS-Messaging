'use strict';

var StreamDuplex = require('stream').Duplex;

module.exports = function(at, MessageWriter){
  if(!MessageWriter) MessageWriter = require('../../shared/Messenger/MessageWriter');
  at.test('Message Writer writes nothing until ready is called', function(t){
    var expectedSend = Math.random();
    var sentValue = [];
    var writer = new MessageWriter(function(sent){
      sentValue.push(sent);
    });

    writer.trigger('a/path', expectedSend);

    writer.request('a/path', expectedSend);

    writer.stream('a/path', expectedSend);

    t.equal(sentValue.length, 0, 'sent no messages');
    t.end();
  });

  at.test('Message Writer can write events', function(t){
    var expectedSend = Math.random();
    var sentValue = [];
    var writer = new MessageWriter(function(sent){
      sentValue.push(sent);
    });

    writer.ready();

    writer.trigger('a/path', expectedSend);

    t.equal(sentValue.length, 1, 'sent one message');
    sentValue = sentValue[0];
    t.notOk(sentValue.error, 'no error was sent');
    t.equal(sentValue.data, expectedSend, 'The data is exactly as it is intended');
    t.equal(sentValue.method, 'trigger', 'The message has a trigger method');
    t.end();
  });

  at.test('Message Writer can make requests', function(t){
    var expectedSend = Math.random();
    var sentValue = [];
    var writer = new MessageWriter(function(sent){
      sentValue.push(sent);
    });

    writer.ready();

    var recievedValue = [];
    writer.request('a/path', expectedSend).then(function(ret){
      recievedValue.push(ret);
    });

    t.equal(sentValue.length, 1, 'sent one message');
    t.notOk(sentValue[0].error, 'no error was sent');
    t.equal(sentValue[0].data, expectedSend, 'The data is exactly as it is intended');
    t.equal(sentValue[0].method, 'request', 'The message has a trigger method');

    t.notOk(recievedValue.length, 'Have not recieved a value yet');

    var expectedReturn = Math.random();

    writer._returnMessage({
      id: sentValue[0].id,
      method: 'request',
      data: expectedReturn,
    });

    t.equal(sentValue.length, 1, 'No additional messages have been sent');
    t.equal(recievedValue.length, 1, 'Have recieved one message');
    t.equal(recievedValue[0], expectedReturn, 'The recieved Value is exactly as we expected');
    t.end();
  });

  at.test('Message Writer can open up streams to a router', function(t){
    var expectedID = void 0;
    var expectedPushes = [Math.random(), Math.random(), Math.random()];
    var expectedReturns = [Math.random(), Math.random(), Math.random()];
    var routed = false;

    var writer = new MessageWriter(function(value){
      routed = true;
      if(!expectedID) expectedID = value.id;
      else t.equal(value.id, expectedID, 'the value has the correct ID');
      t.equal(expectedReturns.length, expectedPushes.length, 'Both arrays should be equal');
      t.equal(value.data, expectedPushes.shift(), 'the returned value is correct');
      if(expectedReturns.length){
        writer._returnMessage({
          method: 'stream',
          id: expectedID,
          data: expectedReturns[0],
        });
      }
    });

    writer.ready();

    var response = writer.stream('a/path', expectedPushes[0]);
    t.ok(response, 'Responses should be available for stream');
    t.ok(response instanceof StreamDuplex, 'Responder is an instance of Node Stream');
    var streamData;
    while(streamData = response.read()){
      t.equal(streamData, expectedReturns.shift(), 'Routed data is the correct value');
      response.write(expectedPushes[0]);
    }

    t.ok(routed, 'Stream was written to successfully');
    t.equal(expectedPushes.length, 0, 'All Writes Were Made');
    t.equal(expectedReturns.length, 0, 'All Responses Were Made');
    t.end();
  });

  at.comment('Message Writer can open up a duplex to the router');
  at.end();
};
