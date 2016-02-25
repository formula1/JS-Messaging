'use strict';

global.Promise = require('../SyncPromise');

global.Promise.resolve = function(value){
  return new Promise(function(res){ res(value); });
};

var tap = require('tap');

tap.test('Shared Tests', function(at){
  at.plan(4);

  at.test('MessageRouter', { autoend: true }, require('./MessageRouter'));

  at.test('MessageWriter', { autoend: true }, require('./MessageWriter'));

  at.test('Message', { autoend: true }, require('./Message'));

  at.test('MessageDuplex', { autoend: true }, require('./MessageDuplex'));

});
