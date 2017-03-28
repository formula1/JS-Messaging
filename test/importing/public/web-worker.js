self.importScripts("/hidden.js");
self.addEventListener("message", function(){
  var fn = require("start-fn");
  fn = fn.default || fn;
  fn();
  self.postMessage("finished");
});
