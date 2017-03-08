var MessageDuplex = require("./es5").default;

if(typeof window !== "undefined"){
  window.MessageDuplex = MessageDuplex;
}
if(typeof global !== "undefined"){
  global.MessageDuplex = MessageDuplex;
}
if(typeof self !== "undefined"){
  self.MessageDuplex = MessageDuplex;
}
