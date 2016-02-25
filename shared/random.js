'use strict';

var counter = 0;

module.exports = function(){
  return Date.now().toString(32) +
    Math.random().toString(32).substring(2) +
    (counter++).toString(32);
};
