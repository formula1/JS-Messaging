'use strict';

var extendError = require('../extendError');

module.exports = extendError('ImproperObject', void 0,
  function(message){
    return `This method Expects ${message.expects} recieved ${message.recieved}`;
  }
);
