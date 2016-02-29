'use strict';

var MessageDuplex = require('../../../shared/Messenger/MessageDuplex');

module.exports = function(at, AsyncMessenger){
  if(!AsyncMessenger) throw new Error('A Messenger instace must be included');
  if(!(AsyncMessenger instanceof  MessageDuplex)) throw new Error('AsyncMessenger must be an instance of  MessageDuplex');

  at.test('Passes MessageRouter tests', function(t){
    require('./MessageRouter')(t, AsyncMessenger);
  });

  at.test('Passes MessageWriter tests', function(t){
    require('./MessageWriter')(t, AsyncMessenger);
  });

  at.test('Passes Message tests with Writer', function(t){
    require('./Message')(t, AsyncMessenger);
  });

  at.test('Passes Message tests with Router', function(t){
    require('./Message')(t, void 0, AsyncMessenger);
  });

  at.test('Passes Message tests with self', function(t){
    require('./Message')(t, AsyncMessenger, AsyncMessenger);
  });

  at.end();
};
