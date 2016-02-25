'use strict';

var MessageDuplex = require('../../shared/Messenger/MessageDuplex');

module.exports = function(at){
  at.plan(5);
  at.test('Passes MessageRouter tests', { autoend: true }, function(t){
    require('./MessageRouter')(t, MessageDuplex);
  });

  at.test('Passes MessageWriter tests', { autoend: true }, function(t){
    require('./MessageWriter')(t, MessageDuplex);
  });

  at.test('Passes Message tests with Writer', { autoend: true }, function(t){
    require('./Message')(t, MessageDuplex);
  });

  at.test('Passes Message tests with Router', { autoend: true }, function(t){
    require('./Message')(t, void 0, MessageDuplex);
  });

  at.test('Passes Message tests with self', { autoend: true }, function(t){
    require('./Message')(t, MessageDuplex, MessageDuplex);
  });
};
