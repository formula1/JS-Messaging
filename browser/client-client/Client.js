'use strict';

var WebRTC = require('wrtc');
var MessageDuplex = require('../../shared/Messenger/MessageDuplex');

var RTCPeerConnection = WebRTC.RTCPeerConnection;

function NetworkInstance(nethost, user){
  this.self = nethost.me;
  this.user = user;
  this.nethost = nethost;
  MessageDuplex.call(this, function(message){
    if(!this._ready) console.log('not ready');
    console.log(JSON.stringify(message).length);
    console.log(JSON.stringify(message));
    this.channel.send(JSON.stringify(message));
  }.bind(this));
  this.pconn = new RTCPeerConnection(nethost.config, {
    optional: [
        { DtlsSrtpKeyAgreement: true },
        { RtpDataChannels: true },
    ],
  });
  this.pconn.onicecandidate = this.iceCB.bind(this);
}

NetworkInstance.prototype = Object.create(MessageDuplex.prototype);
NetworkInstance.prototype.constructor = NetworkInstance;

NetworkInstance.prototype.close = function(){
  this.stop();
  try{
    this.pconn.close();
    this.channel.close();
  }catch(e){
    //we don't care
  }
};

NetworkInstance.prototype.offer = function(){
  var pconn = this.pconn;
  var _this = this;
  return Promise().resolve(function(){
    return _this.registerChannel(pconn.createDataChannel('sendDataChannel', _this.nethost.sconfig));
  }).then(function(){
    return new Promise(pconn.createOffer);
  }).then(function(desc){
    return new Promise(pconn.setLocalDescription.bind(pconn, desc)).then(function(){
      console.log('desc offered');
      return { target:_this.user, sender:_this.self, offer: desc };
    });
  });
};

NetworkInstance.prototype.registerChannel = function(channel){
  var _this = this;
  this.channel = channel;
  this.channel.onmessage = function(event){
    var message;
    try{
      message = JSON.parse(event.data);
    }catch(e){
      console.error(e);
      event.target.close();
      return;
    }

    _this.handleMessage(message, event.target);
  };

  this.channel.onopen = function(){
    _this.ready();
    _this.emit('open', _this);
  };

  this.channel.onclose = this.stop.bind(this);
};

/**
  Accepts a webrtc offer from another party
  @memberof NetwokInstance
  @param {object} message - the original message from the other party
  @returns {Promise<object>} accept_message - Returns a promise that resolves to an accept
*/
NetworkInstance.prototype.accept = function(message){
  var _this = this;
  var pconn = this.pconn;
  pconn.ondatachannel = function(event){
    _this.registerChannel(event.channel);
  };

  return new Promise(pconn.setRemoteDescription.bind(
    pconn, new RTCSessionDescription(message.offer)
  )).then(pconn.createAnswer.bind(pconn))
  .then(pconn.setLocalDescription.bind(pconn))
  .then(function(){
    console.log('desc accepted');
    return {
      target:_this.user,
      sender:_this.self,
      accept:_this.pconn.localDescription,
    };
  });
};

/**
  Solidifies a webrtc connection after the other party accepts
  @memberof NetwokInstance
  @param {object} message - the original message from the other party
  @returns {NetwokInstance} this - returns this for chaining
*/
NetworkInstance.prototype.ok = function(message){
  console.log('desc okayed');
  this.pconn.setRemoteDescription(new RTCSessionDescription(message.accept));
  return this;
};

NetworkInstance.prototype.remoteIce = function(candidate){
  this.pconn.addIceCandidate(new RTCIceCandidate(candidate));
};

NetworkInstance.prototype.iceCB = function(event){
  if(!event.candidate) return;
  this.nethost.trigger('ice', {
    target: this.user,
    sender: this.self,
    ice: event.candidate,
  });
};

module.exports = NetworkInstance;
