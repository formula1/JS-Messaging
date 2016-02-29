'use strict';

var url = require('url');
var Server = require('http').Server;
var WebSocket = require('websocket').W3CWebSocket;

var MessengerToServer = require('../../../../browser/Server');

var createMessengers, cleanupMessengers;
var Tester = require('../../tester');

module.exports = function(at){
  at.test('Can create and destroy', function(t){
    return createMessengers(t).then(function(objs){
      return cleanupMessengers(t, objs);
    }).catch(t.threw.bind(t)).then(function(){
      t.end();
    });
  });

  at.test('Can do triggers', function(t){
    var messengers;
    return createMessengers(t).then(function(objs){
      messengers = objs;
      return Tester.canDoTriggers(t, messengers[0], messengers[1]);
    }).then(function(){
      return Tester.canDoTriggers(t, messengers[1], messengers[0]);
    }).then(function(){
      return Tester.cleanupMessengers(t, messengers);
    }).catch(t.threw.bind(t)).then(function(){
      t.end();
    });
  });

  at.test('Can do requests', function(t){
    var messengers;
    createMessengers().then(function(objs){
      messengers = objs;
      return Tester.canDoRequests(messengers[0], messengers[1]);
    }).then(function(){
      return Tester.canDoRequests(messengers[1], messengers[0]);
    }).then(function(){
      return cleanupMessengers(messengers);
    }).catch(t.threw.bind(t)).then(function(){
      t.end();
    });
  });

  at.test('Can do streams', function(t){
    var messengers;
    createMessengers().then(function(objs){
      messengers = objs;
      return Tester.canDoStreams(messengers[0], messengers[1]);
    }).then(function(){
      return Tester.canDoStreams(messengers[1], messengers[0]);
    }).catch(t.threw.bind(t)).then(function(){
      return cleanupMessengers(messengers);
    });
  });

};

createMessengers = function(t){
  return new Promise(function(res){
    var server = new Server();
    var to, ulist, elist;
    var port = process.env.TEST_PORT || 8080;

    var sMessenger, cMessenger;

    var isReady = 0;
    var readyListener = function(){
      if(!isReady) isReady = 1;
      res([sMessenger, cMessenger, server]);
    };

    to = setTimeout(function(){
      server.removeListener('upgrade', ulist);
      server.removeListener('error', elist);
      t.threw(new Error('timed out'));
    }, 5000);

    server.on('error', elist = function(e){
      server.removeListener('upgrade', ulist);
      clearTimeout(to);
      t.threw(e);
    });

    server.listen(port);

    server.on('upgrade', ulist = function(req, socket){
      server.removeListener('error', elist);
      clearTimeout(to);
      sMessenger = new MessengerToClient(req, socket);
      sMessenger.once('ready', readyListener);
    });

    cMessenger = new MessengerToServer(new WebSocket(url.format({
      protocol: 'ws:',
      hostname: 'localhost',
      port: port,
      pathname: '',
    })));

    cMessenger.once('ready', readyListener);
  });
};

cleanupMessengers = function(objs){
  return new Promise(function(res){
    objs[0].destroy();
    objs[1].destory();

    objs[2].close(res);
  });
};
