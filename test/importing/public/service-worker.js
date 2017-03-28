/* globals Promise */

self.addEventListener("install", function(event){
  self.importScripts("/hidden.js");
  event.waitUntil(Promise.resolve());
});

self.onmessage = function(e){
  var port = e.ports[0];
  var fn = require("start-fn");
  fn = fn.default || fn;
  fn();
  port.postMessage("finished");
};
