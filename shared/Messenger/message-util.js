'use strict';

var genRandom = require('../random.js');

module.exports.createSkeleton = function(type, path){
  return {
    id: genRandom(),
    type: type,
    path: path,
  };
};

module.exports.prepMessage = function(skeleton, data){
  var nMessage = Object.create(skeleton);
  nMessage.data = data;
  return nMessage;
};
