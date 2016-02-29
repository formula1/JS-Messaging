'use strict';

module.exports.canDoTriggers = function(t, router, writer){
  return new Promise(function(res){
    var expectedValue = Math.random().toString();
    var to = setTimeout(function(){
      t.threw(new Error('timed out'));
    }, 5000);

    router.onEvent(/a\/path/, function(message, responder){
      clearTimeout(to);
      t.equal(message, expectedValue, 'Recieved the correct value');

      t.notOk(responder, 'Responses should not be available for events');

      res();
    });

    writer.trigger('a/path', expectedValue);
  });
};

module.exports.canDoRequests = function(t, router, writer){
  return new Promise(function(res){
    var to = setTimeout(function(){
      t.threw(new Error('timed out'));
    }, 5000);

    var expectedArgument = Math.random();
    var expectedReturn = Math.random();

    router.onRequest(/a\/path/, function(recievedArgument, responder){
      t.equal(recievedArgument, expectedArgument, 'Did not recieve the correct value');
      t.ok(responder, 'Responses should be available for requests');
      t.ok(typeof responder.resolve !== 'function', 'Responder has a resolve function');
      t.ok(typeof responder.reject !== 'function', 'Responder has a reject function');

      responder.resolve(expectedReturn);
      throw 'stop';
    });

    writer.request('a/path', expectedArgument).then(function(recievedValue){
      clearTimeout(to);
      t.equal(recievedValue, expectedReturn, 'The recieved Value is exactly as we expected');
      res();
    });
  });
};

var StreamDuplex = require('stream').Duplex;
module.exports.canDoStreams = function(t, router, writer){
  return new Promise(function(res){
    var to = setTimeout(function(){
      t.threw(new Error('timed out'));
    }, 5000);

    var expectedArgument = Math.random();
    var expectedPushes = [Math.random(), Math.random(), Math.random()];
    var expectedReturns = [Math.random(), Math.random(), Math.random()];

    router.onStream(/a\/path/, function(arg, responder){
      t.equal(arg, expectedArgument, 'Recieved the correct initial value');
      t.ok(responder, 'Responses should be available for stream');
      t.ok(responder instanceof StreamDuplex, 'Responder is an instance of Node Stream');
      responder.write(expectedReturns[0]);
      responder.on('data', function(streamData){
        if(expectedPushes.length === 0) return responder.send(null);
        t.equal(streamData, expectedPushes.shift(), 'Routed data is the correct value');
        responder.write(expectedReturns[0]);
      });

      throw 'stop';
    });

    var response = writer.stream('a/path', expectedArgument);
    t.ok(response, 'Responses should be available for stream');
    t.ok(response instanceof StreamDuplex, 'Responder is an instance of Node Stream');
    response.on('data', function(streamData){
      if(expectedReturns.length === 0) return response.send(null);
      t.equal(streamData, expectedReturns.shift(), 'Routed data is the correct value');
      response.write(expectedPushes[0]);
    });

    response.on('end', function(){
      clearTimeout(to);
      t.equal(expectedPushes.length, 0, 'All Writes Were Made');
      t.equal(expectedReturns.length, 0, 'All Responses Were Made');
      res();
    });
  });
};
