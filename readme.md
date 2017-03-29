# Distributed Messenger Utility
[![Build Status](https://travis-ci.org/formula1/JS-Messaging.svg?branch=master)](https://travis-ci.org/formula1/JS-Messaging)
[![Coverage Status](https://coveralls.io/repos/github/formula1/JS-Messaging/badge.svg?branch=master)](https://coveralls.io/github/formula1/JS-Messaging?branch=master)
[![dependencies Status](https://david-dm.org/formula1/JS-Messaging/status.svg)](https://david-dm.org/formula1/JS-Messaging)
[![devDependencies Status](https://david-dm.org/formula1/JS-Messaging/dev-status.svg)](https://david-dm.org/formula1/JS-Messaging?type=dev)

[![Build Status](https://saucelabs.com/browser-matrix/formula1.svg)](https://saucelabs.com/beta/builds/9fb91654fb57484aaba614c50ce70fca)

This is a duplex stream implemented inorder to support multiple formats of communication.

1. Able to emit events and listen for events
2. Able to make requests and respond to requests
3. Able to Open, listen, write to, and end streams

## What is this for?
Often times when Using a Webworker, Child Process or other distributed situations
there will be some sort of need for communication whether its requestion/responding
or writing events. Instead of reimplementing the wheel or having to learn a particular
api each environment this provides a clean interface.

## Why Use?
- Implementation only needs a IO Duplex Stream
- Simple Request System allowing for the user to initialize many different
- Sophisticated and Clean Routing System
- Coverage is at 100
- Uses TypeScript
- **Works With** - Though you might need a [json encoder/decoder](https://github.com/dominictarr/JSONStream)
  - websocket Stream - https://www.npmjs.com/package/websocket-stream
  - childprocess stream - https://www.npmjs.com/package/duplex-child-process
  - webworker Stream - https://www.npmjs.com/package/workerstream
  - webrtc Stream - https://www.npmjs.com/package/rtc-stream

## Competitors
- http://www.jsonrpc.org/specification
- https://github.com/postaljs

## Roadmap
- Become Heavily Involved with [protobuf](https://www.npmjs.com/package/protobufjs)
- Show implementations

# Usage

### Construct and Use
```javascript
var MessageDuplex = require("message-duplex");
var messageduplex = new MessageDuplex();

myOtherStream.pipe(messageduplex).pipe(myOtherStream)
```


### Listen For Messages
```javascript
messageduplex.use("/path", function(){
  return new Promise(function(){
    // in order to delay execution of future paths
    // can be done in any listener
  })
})

messageduplex.onTrigger("/path", function(data, responder){
  responder.capture(); // inorder to prevent future paths from recieving the event
})

messageduplex.onRequest("/path", function(data, responder){
  responder.resolve(data); // inorder to prevent future paths from recieving the event
  responder.reject(error); // loudly reject the request
  responder.abort(); // to silently ignore this request
})

var route = messageduplex.onStream("/path", function(data, responder){
  responder.reject(); // to loudly reject the stream
  responder.abort(); // to silently ignore this stream
  responder.on("data", function(){
    // responder is a stream that can read and write
    responder.write("echo");
  });
});

messageduplex.removeRoute(route);
// Removing a route is simple and clean
```

### Create Messages

```javascript
messageduplex.trigger("/path", {data: "here"})
messageduplex.request("/path", {data: "here"}).then(
  function(resolvedResponse){  },
  function(rejectedResponse){  }
)

var stream = messageduplex.stream("/path", {initalData: "here"});

stream.on("data", function(streamData){  })
stream.on("error", function(streamError){  })
stream.on("finish", function(){  });

stream.write("future data");
stream.end("finish Message");
```
