'use strict';

var extendError = require('../extendError');

module.exports = extendError('MissingMessageError', void 0, function(message){
    return `Message ${message.id || message} does not exist`;
  }
);
