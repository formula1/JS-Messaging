'use strict';

module.exports = function(at, MessageRouter, MessageWriter){
  at.plan(0);
  MessageRouter = MessageRouter || require('../../shared/Messenger/MessageRouter');
  MessageWriter =  MessageWriter || require('../../shared/Messenger/MessageWriter');

  at.comment('Router can read messages sent from writer');

  at.comment('Stringify and Parsing messages will not harm their integrity');

  at.comment('Communication between Writer and Router is very simple');

  // , function(){
  //   var messenger = new MessageRouter();
  //   messenger.once('echo', function(message){
  //     message.nonExistingFunction();
  //   });
  //
  //   messenger.once('error', function(e){
  //     messenger.removeListener('echo');
  //     throw e;
  //   });
  // });

};
