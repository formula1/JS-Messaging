'use strict';

var ClientManager;

module.exports = ClientManager = function(){

};


ClientManager.prototype.handleUpgrade = function(request, socket){
  var wsRequest = new WebSocketRequest(socket, request, this.config);

  try{
    wsRequest.readHandshake();
  }catch(e){
    wsRequest.reject(
      e.httpCode ? e.httpCode : 400,
      e.message,
      e.headers
    );

    debug('Invalid handshake: %s', e.message);
    return;
  }

  this.pendingRequests.push(wsRequest);

  wsRequest.once('requestAccepted', this._handlers.requestAccepted);
  wsRequest.once('requestResolved', this._handlers.requestResolved);

  if(!this.config.autoAcceptConnections && utils.eventEmitterListenerCount(this, 'request') > 0){
    this.emit('request', wsRequest);
  }

  else if(this.config.autoAcceptConnections){
    wsRequest.accept(wsRequest.requestedProtocols[0], wsRequest.origin);
  }else{
    wsRequest.reject(404, 'No handler is configured to accept the connection.');
  }
};
