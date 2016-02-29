'use strict';

var run = require('tape-run');
var browserify = require('browserify');

var stream = run();

var curPromise, curTest, done, runCommand;

stream.on('results', console.log);

var lines = stream.pipe(split).once('data', function(line){
  if(line !== 'READY') throw new Error('expected line to be READY');
  lines.on('data', runCommand);
});

runCommand = function(command){
  if(command === 'DONE();'){
    return curPromise();
  }
  command = /^(\w+)\: \'(.*)\' \'(.*)\'/.exec(command);
  if(!command) return;
  switch(command[0].toUpperCase()){
    case 'BUILD': return curTest.build().then(done).catch(threw);
    case 'GETDATA': return stream.write(JSON.stringify(curTest.data));
    case 'START': return curTest.start();
  }
};

done = function(){
  stream.write('DONE();\n');
};

browserify(__dirname + '/test/test.js')
  .bundle()
  .pipe(stream);


module.exports.consoleTester = {
  ok: function(boo, type, rej){
    if(!boo) return rej(type)
    console.log(`TEST: true \'${type}\'`);
  }
}

module.exports.canDoTriggersRouter = function(t, testType, getExpectedValues, generateRouter){
  var expected;
  getExpectedValues('trigger').then(function(values){
    expected = values;
    return generateRouter();
  }).then(function(router){
    return new Promise(function(res, rej){
      var to = setTimeout(function(){
        rej(new Error('timed out'));
      }, 5000);

      router.onEvent(/a\/path/, function(message, responder){
        clearTimeout(to);
        t.equal(message, expected.value, 'Recieved the correct value', rej);

        t.notOk(responder, 'Responses should not be available for events', rej);

        res();
      });
    });
  }).then(function(){
    t.end();
  }).catch(function(err){

  })
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
