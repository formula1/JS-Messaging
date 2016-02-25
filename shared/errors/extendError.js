'use strict';

var util = require('util');
var assert = require('assert');

module.exports = function(subTypeName, /*optional*/ errorCode, /*optional*/ messageFormatter){
  assert(subTypeName, 'subTypeName is required');

  if(!messageFormatter) messageFormatter = function(v){ return v; };

  //define new error type

  var SubType = function(message){
    //handle constructor call without 'new'
    if(!(this instanceof SubType)) return new SubType(message);

    //populate error details
    this.name = subTypeName;
    this.code = errorCode;
    this.message = messageFormatter(message || '');

    //include stack trace in error object
    Error.captureStackTrace(this, this.constructor);
  };

  //inherit the base prototype chain
  util.inherits(SubType, this);

  //override the toString method to error type name and inspected message (to expand objects)
  SubType.prototype.toString = function(){
    return `${this.name}: ${util.inspect(this.message)}`;
  };

  //attach extend() to the SubType to make it extendable further
  SubType.extend = this.extend;

  return SubType;
}.bind(Error);
