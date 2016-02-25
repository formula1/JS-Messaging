'use strict';

var mutil = require('../../shared/Messenger/message-util.js');

module.exports = function(at, MessageRouter, MessageWriter){
  if(!MessageRouter) MessageRouter = require('../../shared/Messenger/MessageRouter');
  if(!MessageWriter) MessageWriter = require('../../shared/Messenger/MessageWriter');

  at.test('Message Skeleton Factory', function(t){

    var method = 'trigger';
    var path = 'a/path';
    var skeleton = mutil.skeletonFactory(method, path);

    t.equal(typeof skeleton, 'object', 'The typeof skeleton is equal to an object');
    t.ok('id' in skeleton, 'id exists in skeleton');
    t.ok('path' in skeleton, 'path exists in skeleton');
    t.equal(skeleton.path, path, 'path is what we set');
    t.ok('method' in skeleton, 'method exists in skeleton');
    t.equal(skeleton.method, method, 'method is what we set');
    t.notOk('data' in skeleton, 'data is not in skeleton');
    t.notOk('error' in skeleton, 'error is not in skeleton');

    var oskeleton = mutil.skeletonFactory(method, path);

    t.equal(typeof oskeleton, 'object', 'Created another skeleton');
    t.ok('id' in oskeleton, 'id exists in other skeleton');
    t.ok('path' in oskeleton, 'path exists in other skeleton');
    t.equal(oskeleton.path, skeleton.path, 'skeleton path is equal to other skeleton path');
    t.ok('method' in oskeleton, 'method exists in other skeleton');
    t.equal(oskeleton.method, skeleton.method, 'skeleton method is equal to other skeleton method');
    t.notOk('data' in oskeleton, 'data is not in other skeleton');
    t.notOk('error' in oskeleton, 'error is not in other skeleton');

    t.notEqual(oskeleton.id, skeleton.id, 'ids will not be equal with same parameters');

    t.end();
  });

  at.test('Message Generation', function(t){
    var expectedData = Math.random();
    var method = 'trigger';
    var path = 'a/path';

    var skeleton = mutil.skeletonFactory(method, path);
    var message = mutil.prepMessage(skeleton, expectedData);
    t.equal(typeof message, 'object', 'Created a message');
    t.ok('id' in message, 'id exists in message');
    t.equal(message.id, skeleton.id, 'Id of message is equal to its skeleton');
    t.ok('path' in message, 'path exists in message');
    t.equal(message.path, skeleton.path, 'message path is equal to skeleton path');
    t.ok('method' in message, 'method exists in message');
    t.equal(message.method, skeleton.method, 'message method is equal to skeleton method');
    t.ok('data' in message, 'data is in the message');
    t.equal(message.data, expectedData, 'data is what we expect');
    t.notOk('data' in skeleton, 'data is not in skeleton');
    t.notOk('error' in message, 'error is not in the message');

    var cloned = JSON.parse(JSON.stringify(message));

    var keys = Object.keys(message);
    t.equal(
      Object.keys(cloned).length, keys.length,
      'clone and original have the same number of keys'
    );
    keys.forEach(function(key){
      t.ok(key in cloned, `clone has key ${key}`);
      t.equal(cloned.key, message.key, '`clone and message have same value for ${key}`');
    });

    t.end();
  });

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
