self.importScripts("/hidden.js");
self.onconnect = function(e){
  var port = e.ports[0];
  port.addEventListener("message", function(){
    var fn = require("start-fn");
    fn = fn.default || fn;
    fn();
    port.postMessage("finished");
  });
  port.start();
};
