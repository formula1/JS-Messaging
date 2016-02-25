'use strict';

var MessagePromise;

module.exports = MessagePromise = function(parent, message){
  this.parent = parent;
  Promise.call(this, function(res, rej){
    parent._pending.once(message.id, function(err, ret){
      if(err) return rej(err);
      res(ret);
    });

    console.log('ABOUT TO SEND MESSAGE');

    parent._sendMessage(message);
  });
};

MessagePromise.prototype = Object.create(Promise.prototype);
MessagePromise.prototype.constructor = MessagePromise;

MessagePromise.prototype.abort = function(){
  this.parent.abort(this.skel);
};
