var tap = require("tap");
var path = require("path");
var __root = path.resolve(__dirname, "..");
var mainLocation = require(path.join(__root + "/package.json")).main;
var Duplex = require(path.join(__root, mainLocation));
var METHODS = Duplex.METHODS;
var defaultErrorHandler = Duplex.defaultErrorHandler;

var routeTypes = [METHODS.TRIGGER, METHODS.REQUEST, METHODS.STREAM_START];
var abortableTypes = [METHODS.REQUEST, METHODS.STREAM_START];
var routeTypeToMethod = {
  [METHODS.TRIGGER]: "onTrigger",
  [METHODS.REQUEST]: "onRequest",
  [METHODS.STREAM_START]: "onStream",
};
var routeTypeToWriteMethod = {
  [METHODS.REQUEST]: "resolve",
  [METHODS.STREAM_START]: "write",
};
var routeTypeToCreateMethod = {
  [METHODS.TRIGGER]: "trigger",
  [METHODS.REQUEST]: "request",
  [METHODS.STREAM_START]: "stream",
};

tap.test("errors", function(tv){
  var routeDup;
  tv.test("destroying will prevent responses without error", function(td){
    td.beforeEach(function(){
      return Promise.resolve().then(function(){
        routeDup = new Duplex();
      });
    });
    abortableTypes.forEach(function(routeType){
      var method = routeTypeToMethod[routeType];
      var writeMethod = routeTypeToWriteMethod[routeType];
      td.test(routeType, function(tr){
        var expectedValue = {};
        var recievedValue = false;
        var expectedResp = {};
        var respValues = [];
        var id = Date.now().toString();
        routeDup.on("data", function(msg){
          respValues.push(msg);
        });
        routeDup[method]("/meh", function(data, responder){
          recievedValue = data;
          return new Promise(function(res){
            setTimeout(res, 200);
          }).then(function(){
            responder[writeMethod](expectedResp);
            tr.pass("response attempted");
          });
        });
        return Promise.all([
          routeDup.routeMessage({
            id: id,
            method: routeType,
            path: "/meh",
            data: expectedValue,
          }).then(function(){
            tr.equal(recievedValue, expectedValue, "Value is correct");
            tr.equal(respValues.length, 0, "no responses sent despite error");
          }),
          routeDup.destroy(),
        ]).then(function(){
          tr.end();
        });
      });
    });
    td.end();
  });
  tv.test("destroying will prevent writes with error", function(td){
    td.beforeEach(function(){
      return Promise.resolve().then(function(){
        routeDup = new Duplex();
      });
    });
    routeTypes.forEach(function(routeType){
      var createMethod = routeTypeToCreateMethod[routeType];
      td.test(routeType, function(tr){
        var expectedValue = {};
        var sentValues = [];
        routeDup.on("data", function(msg){
          sentValues.push(msg);
        });
        return Promise.resolve().then(function(){
          routeDup.destroy(),
          routeDup[createMethod]("/meh", expectedValue);
        }).then(function(){
          throw new Error("did not throw an error");
        }, function(err){
          tr.pass("an error was thrown");
          tr.ok(err, "an error was exists");
          return new Promise(function(res){
            setTimeout(res, 200);
          });
        }).then(function(){
          tr.equal(sentValues.length, 0, "no data sent");
          tr.end();
        });
      });
    });
    td.end();
  });

  tv.test("can catch errors thrown by router", function(td){
    td.beforeEach(function(){
      return Promise.resolve().then(function(){
        routeDup = new Duplex();
      });
    });
    routeTypes.forEach(function(routeType){
      var method = routeTypeToMethod[routeType];
      td.test(routeType, function(tr){
        var error = {};
        var respValues = [];
        var expectedRec = {};
        var recievedValue = false;
        var id = Date.now().toString();
        var sentMessage = {
          id: id,
          method: routeType,
          path: "/meh",
          data: expectedRec,
        };
        routeDup.on("data", function(msg){
          respValues.push(msg);
        });
        routeDup[method]("/meh", function(data){
          recievedValue = data;
          throw error;
        });
        return routeDup.routeMessage(sentMessage).then(function(){
          throw new Error("should have thrown an error");
        }, function(err){
          tr.equal(recievedValue, expectedRec, "Value is correct");
          tr.equal(err.error, error, "error recieved is expected");
          tr.equal(err.message, sentMessage, "error recieved is expected");
          tr.equal(respValues.length, 0, "no response should have been handled");
          tr.end();
        });
      });
    });
    td.end();
  });
  tv.test("caught errors thrown by router produce error responses", function(td){
    td.beforeEach(function(){
      return Promise.resolve().then(function(){
        routeDup = new Duplex();
      });
    });
    abortableTypes.forEach(function(routeType){
      var method = routeTypeToMethod[routeType];
      td.test(routeType, function(tr){
        var error = {};
        var respValues = [];
        var expectedRec = {};
        var recievedValue = false;
        var id = Date.now().toString();
        var sentMessage = {
          id: id,
          method: routeType,
          path: "/meh",
          data: expectedRec,
        };
        routeDup.on("data", function(msg){
          respValues.push(msg);
        });
        routeDup[method]("/meh", function(data){
          recievedValue = data;
          throw error;
        });
        return routeDup.routeMessage(sentMessage).then(function(){
          throw new Error("should have thrown an error");
        }, function(err){
          tr.equal(recievedValue, expectedRec, "Value is correct");
          tr.equal(err.error, error, "error recieved is expected");
          tr.equal(err.message, sentMessage, "error recieved is expected");
          tr.equal(respValues.length, 0, "no response should have been handled");
          return defaultErrorHandler(err);
        }).then(function(){
          return new Promise(function(res){ setTimeout(res, 200); });
        }).then(function(){
          tr.ok(respValues.length > 0, "a response should have been sent");
          tr.equal(respValues[0].data, error, "error value is correct");
          tr.ok(respValues[0].error, "response is an error");
          tr.end();
        });
      });
    });
    td.end();
  });
  tv.test("some errors thrown will be ignored", function(tvv){
    tvv.test("when the error is not an object", function(tr){
      [void 0, true, function(){}, "string", 1].forEach(function(type){
        defaultErrorHandler(type);
        tr.pass("no error occured for " + typeof type);
      });
      tr.end();
    });
    tvv.test("when the error is not a route state", function(tr){
      [{ error: true }, { responder: true }, { message: true }].forEach(function(type){
        defaultErrorHandler(type);
        tr.pass("no error occured for " + JSON.stringify(type));
      });
      tr.end();
    });

    tvv.test("when method is trigger", function(tr){
      var error = {};
      var respValues = [];
      var expectedRec = {};
      var recievedValue = false;
      routeDup.on("data", function(msg){
        respValues.push(msg);
      });
      routeDup.onTrigger("/meh", function(data){
        recievedValue = data;
        throw error;
      });
      return routeDup.routeMessage({
        id: Date.now().toString(),
        method: METHODS.TRIGGER,
        path: "/meh",
        data: expectedRec,
      }).then(function(){
        throw new Error("should have thrown an error");
      }, function(err){
        tr.pass("an error occured");
        tr.equal(recievedValue, expectedRec, "Value is recieved");
        tr.notEqual(err, error, "route error was not the thrown error");
        return defaultErrorHandler(err);
      }).then(function(){
        tr.equal(respValues.length, 0, "no response should have been handled");
        tr.end();
      });
    });
    [
      {
        name: "missing id for abort",
        fn: function(expectedRec){
          return routeDup.routeMessage({
            id: Date.now().toString(),
            method: METHODS.ABORT,
            path: "/meh",
            data: expectedRec,
          });
        },
        types: routeTypes,
      },
      {
        name: "non existant id for stream part",
        fn: function(expectedRec){
          return routeDup.routeMessage({
            id: Date.now().toString(),
            method: METHODS.STREAM_PART,
            path: "/meh",
            data: expectedRec,
          });
        },
        types: routeTypes,
      },
      {
        name: "non existant id for stream end",
        fn: function(){
          return routeDup.routeMessage({
            id: Date.now().toString(),
            method: METHODS.STREAM_END,
            path: "/meh",
            data: null,
          });
        },
        types: routeTypes,
      },
      {
        name: "interfering ids",
        fn: function(){
          var id = Date.now().toString();
          return Promise.race([
            routeDup.routeMessage({
              id: id,
              method: METHODS.STREAM_START,
              path: "/hang-forever",
              data: null,
            }),
            routeDup.routeMessage({
              id: id,
              method: METHODS.STREAM_START,
              path: "/hang-forever",
              data: null,
            }),
          ]);
        },
        types: abortableTypes,
      },
      {
        name: "invalid method",
        fn: function(){
          return routeDup.routeMessage({
            id: Date.now().toString(),
            method: "DEFINIELY NOT A METHOD" + METHODS.STREAM_START,
            path: "/hang-forever",
            data: null,
          });
        },
        types: abortableTypes,
      },
    ].forEach(function(testData){
      tvv.test(testData.name, function(td){
        testData.types.forEach(function(routeType){
          var method = routeTypeToMethod[routeType];
          td.beforeEach(function(){
            return Promise.resolve().then(function(){
              routeDup = new Duplex();
            });
          });
          td.test(function(tr){
            var error = {};
            var respValues = [];
            var expectedRec = {};
            var recievedValue = false;
            routeDup.on("data", function(msg){
              respValues.push(msg);
            });
            routeDup[method]("/meh", function(data){
              recievedValue = data;
              throw error;
            });
            routeDup[method]("/hang-forever", function(){
              return new Promise(function(){

              });
            });
            return testData.fn(expectedRec).then(function(){
              throw new Error("should have thrown an error");
            }, function(err){
              tr.pass("an error occured");
              tr.equal(recievedValue, false, "Value is never recieved");
              tr.notEqual(err, error, "route error was not the thrown error");
              return defaultErrorHandler(err);
            }).then(function(){
              tr.equal(respValues.length, 0, "no response should have been handled");
              tr.end();
            });
          });
        });
        td.end();
      });
    });
    tvv.end();
  });
  tv.test("Cannot send stream data to request", function(tr){
    var respValues = [];
    var tDup = new Duplex();
    var requestOccured = false;
    var requestEnded = false;
    var id = Date.now().toString();
    tDup.on("data", function(msg){
      respValues.push(msg);
    });
    tDup.onRequest("/meh", function(){
      requestOccured = true;
      return new Promise(function(){}).then(function(){
        requestEnded = true;
      });
    });
    return Promise.race([
      tDup.routeMessage({
        id: id,
        method: METHODS.REQUEST,
        path: "/meh",
        data: null,
      }),
      new Promise(function(res){ setTimeout(res, 200); })
    ]).then(function(){
      tr.ok(requestOccured, "request did occur");
      tr.notOk(requestEnded, "request did end");
      return tDup.routeMessage({
        id: id,
        method: METHODS.STREAM_PART,
        path: "/meh",
        data: {},
      });
    }).then(function(){
        throw new Error("should have thrown an error");
      }, function(){
        tr.ok(requestOccured, "request did occur");
        tr.notOk(requestEnded, "request did end");
        tr.equal(respValues.length, 0, "no responses should have occured");
        tr.pass("an error was thrown");
      }
    ).then(function(){
      tr.end();
    });
  });
  tv.test("Cannot send stream end to request", function(tr){
    var respValues = [];
    var requestOccured = false;
    var requestEnded = false;
    var id = Date.now().toString();
    var tDup = new Duplex();
    tDup.on("data", function(msg){
      respValues.push(msg);
    });
    tDup.onRequest("/meh", function(){
      requestOccured = true;
      return new Promise(function(){}).then(function(){
        requestEnded = true;
      });
    });
    return Promise.race([
      tDup.routeMessage({
        id: id,
        method: METHODS.REQUEST,
        path: "/meh",
        data: null,
      }),
      new Promise(function(res){ setTimeout(res, 200); })
    ]).then(function(){
      tr.ok(requestOccured, "request did occur");
      tr.notOk(requestEnded, "request did end");
      return tDup.routeMessage({
        id: id,
        method: METHODS.STREAM_END,
        path: "/meh",
        data: {},
      });
    }).then(function(){
        throw new Error("should have thrown an error");
      }, function(){
        tr.ok(requestOccured, "request did occur");
        tr.notOk(requestEnded, "request did end");
        tr.equal(respValues.length, 0, "no responses should have occured");
        tr.pass("an error was thrown");
      }
    ).then(function(){
      tr.end();
    });
  });
  tv.end();
});
tap.end();
