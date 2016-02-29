'use strict';

var url = require('url');

module.exports.formatURL = function(uri, parentUri){
  if(!parentUri) parentUri = window.location.href;
  if(typeof parentUri !== 'object') parentUri = url.parse(parentUri);
  else parentUri = url.parse(url.format(parentUri)); // ensure integrity
  if(!uri) uri = '';

  if(typeof uri === 'object') uri = uri.parse(uri.format(uri)); //for error checking
  else uri = url.parse(uri);

  if(!uri.host) uri.host = parentUri.host;
  if(!uri.port) uri.port = parentUri.port;
  if(!uri.pathname) uri.pathname = parentUri.pathname;
  if(!uri.pass) uri.pass = uri.pass;
  uri.protocol = parentUri.protocol; // this is ALWAYS implemented
};
