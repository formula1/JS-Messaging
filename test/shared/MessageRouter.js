'use strict';
var StreamDuplex = require('stream').Duplex;

module.exports = function(at, MessageRouter){
  if(!MessageRouter) MessageRouter = require('../../shared/Messenger/MessageRouter');
  at.test('Can route events', function(t){
    var backValue = void 0;
    var router = new MessageRouter(function(value){
      backValue = value;
    });

    var expectedValue = Math.random().toString();
    var routed = false;

    router.onEvent(/a\/path/, function(message, responder){
      routed = true;
      t.equal(message, expectedValue, 'Recieved the correct value');
      t.notOk(responder, 'Responses should not be available for events');
    });

    router.route({
      method: 'trigger',
      path: 'a/path',
      id: Math.random(),
      data: expectedValue,
    }).catch(function(err){
      t.threw(err);
    });

    t.notOk(backValue, 'Router Never Returns anything');
    t.ok(routed, 'Router Successfully Routed');
    t.end();
  });

  at.test('Can route requests', function(t){
    var backValue = void 0;
    var router = new MessageRouter(function(value){
      backValue = value;
    });

    var expectedID = Math.random();
    var expectedArgument = Math.random();
    var expectedReturn = Math.random();
    var routed = false;

    router.onRequest(/a\/path/, function(arg, responder){
      routed = true;
      t.equal(arg, expectedArgument, 'Recieved the correct value');
      t.ok(responder, 'Responses should be available for requests');
      t.equal(typeof responder.resolve, 'function', 'Responder has a resolve function');
      t.equal(typeof responder.reject, 'function', 'Responder has a reject function');
      responder.resolve(expectedReturn);
      throw 'stop';
    });

    router.route({
      method: 'request',
      path: 'a/path',
      id: expectedID,
      data: expectedArgument,
    }).catch(function(e){
      t.threw(e);
    });

    t.ok(routed, 'Router Successfully Routed');
    t.ok(backValue, 'Router Returns a value');
    t.equal(backValue.data, expectedReturn, 'What gets returned is predictable');
    t.end();
  });

  at.test('Can route streams', function(t){
    var expectedID = Math.random();
    var expectedArgument = Math.random();
    var expectedPushes = [Math.random(), Math.random(), Math.random()];
    var expectedReturns = [Math.random(), Math.random(), Math.random()];
    var routed = false;

    var router = new MessageRouter(function(value){
      t.equal(value.id, expectedID, 'the value has the correct ID');
      t.equal(expectedReturns.length, expectedPushes.length, 'Both arrays should be equal');
      t.equal(value.data, expectedReturns.shift(), 'the returned value is correct');
      if(expectedPushes.length){
        router.route({
          method: 'stream',
          id: expectedID,
          data: expectedPushes[0],
        });
      }
    });

    var stream;

    router.onStream(/a\/path/, function(arg, responder){
      routed = true;
      t.equal(arg, expectedArgument, 'Recieved the correct initial value');
      t.ok(responder, 'Responses should be available for stream');
      t.ok(responder instanceof StreamDuplex, 'Responder is an instance of Node Stream');
      stream = responder;

      responder.write(expectedReturns[0]);
      var streamData;
      while(streamData = responder.read()){
        t.equal(streamData, expectedPushes.shift(), 'Routed data is the correct value');
        responder.write(expectedReturns[0]);
      }

      throw 'stop';
    });

    router.route({
      method: 'stream',
      path: 'a/path',
      id: expectedID,
      data: expectedArgument,
    }).catch(function(err){
      t.threw(err);
    });

    t.ok(routed, 'Stream was routed successfully');
    t.ok(stream instanceof StreamDuplex, 'Path was initialized');
    t.equal(expectedPushes.length, 0, 'All Writes Were Made');
    t.equal(expectedReturns.length, 0, 'All Responses Were Made');
    t.end();
  });

  at.test('Can abort streams from client', function(t){
    var expectedID = Math.random();
    var expectedArgument = Math.random();
    var expectedReturn = Math.random();
    var aborted = false;
    var retValue;

    var router = new MessageRouter(function(value){
      if(value.method === 'abort') return aborted = true;
      retValue = value;
    });

    var stream;

    router.onStream(/a\/path/, function(arg, responder){
      t.equal(arg, expectedArgument, 'Recieved the correct initial value');
      t.ok(responder, 'Responses should be available for stream');
      t.ok(responder instanceof StreamDuplex, 'Responder is an instance of Node Stream');
      stream = responder;
      responder.write(expectedReturn);
      throw 'stop';
    });

    router.route({
      method: 'stream',
      path: 'a/path',
      id: expectedID,
      data: expectedArgument,
    }).catch(function(err){
      t.threw(err);
    });

    t.notOk(retValue.error, 'an error should not be returned');
    t.equal(retValue.id, expectedID, 'the value has the correct ID');
    t.equal(retValue.data, expectedReturn, 'the returned value is correct');

    t.ok(stream instanceof StreamDuplex, 'Path was initialized');

    stream.abort();
    router.route({
      method: 'abort',
      id: expectedID,
    });

    t.ok(aborted, 'Abort Command Sent to the Client');
    t.ok(stream._readableState.ended, 'After Abort the Stream Will no longer recieve data');
    t.ok(stream._writableState.ended, 'After Abort the Stream Will no longer write data');

    var recieved = false;

    stream.once('data', function(){
      recieved = true;
    });

    router.route({
      method: 'stream',
      id: expectedID,
      data: 'data',
    });

    t.notOk(recieved, 'After aborting, the Stream should no longer accept data');
    t.end();
  });

  at.test('Can abort streams from router', function(t){
    var expectedID = Math.random();
    var expectedArgument = Math.random();
    var expectedReturn = Math.random();
    var aborted = false;
    var retValue;

    var router = new MessageRouter(function(value){
      if(value.method === 'abort') return aborted = true;
      retValue = value;
    });

    var stream;

    router.onStream(/a\/path/, function(arg, responder){
      t.equal(arg, expectedArgument, 'Recieved the correct initial value');
      t.ok(responder, 'Responses should be available for stream');
      t.ok(responder instanceof StreamDuplex, 'Responder is an instance of Node Stream');
      stream = responder;
      responder.write(expectedReturn);
      throw 'stop';
    });

    router.route({
      method: 'stream',
      path: 'a/path',
      id: expectedID,
      data: expectedArgument,
    }).catch(function(err){
      t.threw(err);
    });

    t.notOk(retValue.error, 'an error should not be returned');
    t.equal(retValue.id, expectedID, 'the value has the correct ID');
    t.equal(retValue.data, expectedReturn, 'the returned value is correct');

    t.ok(stream instanceof StreamDuplex, 'Path was initialized');

    stream.abort();

    t.ok(aborted, 'After aborting, should recieve abort on client side');
    t.ok(stream._readableState.ended, 'After Abort the Stream Will no longer recieve data');
    t.ok(stream._writableState.ended, 'After Abort the Stream Will no longer write data');

    var recieved = false;

    stream.once('data', function(){
      recieved = true;
    });

    router.route({
      method: 'stream',
      id: expectedID,
      data: 'data',
    });

    t.notOk(recieved, 'After aborting, the Stream should no longer accept data');
    t.end();
  });

  at.end();
};
