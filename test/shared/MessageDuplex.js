'use strict';

var MessageDuplex = require('../../shared/Messenger/MessageDuplex');

module.exports = function(at){
  at.plan(5);
  at.test('Passes MessageRouter tests', function(t){
    require('./MessageRouter')(t, MessageDuplex);
  });

  at.test('Passes MessageWriter tests', function(t){
    require('./MessageWriter')(t, MessageDuplex);
  });

  at.test('Passes Message tests with Writer', function(t){
    require('./Message')(t, MessageDuplex);
  });

  at.test('Passes Message tests with Router', function(t){
    require('./Message')(t, void 0, MessageDuplex);
  });

  at.test('Passes Message tests with self', function(t){
    require('./Message')(t, MessageDuplex, MessageDuplex);
  });

  at.end();
};
