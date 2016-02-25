'use strict';

var genRandom = require('../random.js');

module.exports.skeletonFactory = function(method, path){
  return {
    id: genRandom(),
    method: method,
    path: path,
  };
};

module.exports.prepMessage = function(skeleton, data){
  var nMessage = Object.create(skeleton);
  nMessage.data = data;
  return nMessage;
};
