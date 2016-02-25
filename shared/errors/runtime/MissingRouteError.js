'use strict';

var extendError = require('../extendError');

module.exports = extendError('MissingRouteError', void 0, function(message){
    return `Router for ${message.path} does not exist`;
  }
);
