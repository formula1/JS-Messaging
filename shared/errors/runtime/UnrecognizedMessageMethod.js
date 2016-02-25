'use strict';

var extendError = require('../extendError');

module.exports = extendError('UnrecognizedMessageMethod', void 0, function(message){
  return `Message Type ${message.type} is not processable`;
});
