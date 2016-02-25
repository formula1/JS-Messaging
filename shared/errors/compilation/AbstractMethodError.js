'use strict';

var AbstractMethodError;

module.exports = AbstractMethodError = function(classname, name){
  this.name = 'AbstractMethodError';
  this.message = 'The abstract method ' + name + ' of class ' + classname + 'needs to be overwritten';
  this.stack = (new Error()).stack;

};

AbstractMethodError.prototype = Object.create(Error);
AbstractMethodError.prototype.constructor = AbstractMethodError;
