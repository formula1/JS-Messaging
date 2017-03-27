var tap = require("tape");
var Duplex = require("../../dist/node");
var util = require("../util");
var writeToStream = util.writeToStream;
var METHODS = Duplex.METHODS;

tap.test("streams", function(tt){
  tt.test("capture request", function(td){
    ["reject", "capture"].map(function(key){
      return td.test(key, function(tv){
        tv.test("captures event", function(tr){
          var expectedValue = {};
          var recievedValue = false;
          var dup1Value = false;
          var routeDup = new Duplex();
          routeDup.onStream("/meh", function(data, responder){
            recievedValue = data;
            responder[key]();
          });
          routeDup.onStream("/meh", function(data){
            dup1Value = data;
          });
          return routeDup.routeMessage({
            id: Date.now().toString(),
            method: METHODS.STREAM_START,
            path: "/meh",
            data: expectedValue,
          }).then(function(boo){
            tr.ok(boo.isEnded, "router was captured");
            tr.equal(recievedValue, expectedValue, "Value is correct");
            tr.notOk(dup1Value, "Duplicate1 is skipped");
            tr.end();
          });
        });
        tv.test("multiple calls produces errors", function(tr){
          var expectRecValue = {};
          var recievedValue = false;
          var routeDup = new Duplex();
          routeDup.onStream("/meh", function(data, responder){
            recievedValue = data;
            responder[key](1);
            responder[key](1);
          });
          return routeDup.routeMessage({
            id: Date.now().toString(),
            method: METHODS.STREAM_START,
            path: "/meh",
            data: expectRecValue,
          }).then(function(){
            throw new Error("should have produced an error");
          }, function(messageState){
            tr.pass("multiple calls caused an error");
            return new Promise(function(res){
              setTimeout(function(){
                res(messageState);
              }, 200);
            });
          }).then(function(messageState){
            tr.ok(messageState.isEnded, "router captured message");
            tr.ok(messageState.error, "error exists on messageState");
            tr.equal(recievedValue, expectRecValue, "recieved value is correct");
            tr.end();
          });
        });
        tv.end();
      });
    });
    td.end();
  });
  tt.test("does not respond", function(tv){
    ["capture"].forEach(function(key){
      tv.test(key, function(tr){
        var values = [];
        var routeDup = new Duplex();
        routeDup.on("data", function(val){
          values.push(val.error);
        });
        routeDup.onStream("/meh", function(data, responder){
          responder[key]("anything");
        });
        return routeDup.routeMessage({
          id: Date.now().toString(),
          method: METHODS.STREAM_START,
          path: "/meh",
          data: null,
        }).then(function(messageState){
          return new Promise(function(res){
            setTimeout(function(){
              res(messageState);
            }, 200);
          });
        }).then(function(messageState){
          tr.ok(messageState.isEnded, "router had no problems");
          tr.equal(values.length, 0, "The correct number of values were recieved");
          tr.end();
        });
      });
    });
    tv.end();
  });
  tt.test("does respond", function(tv){
    ["end", "reject"].forEach(function(key){
      tv.test(key, function(tr){
        var testData = {};
        var values = [];
        var routeDup = new Duplex();
        routeDup.on("data", function(val){
          values.push(val);
        });
        routeDup.onStream("/meh", function(data, responder){
          responder[key](testData);
        });
        return routeDup.routeMessage({
          id: Date.now().toString(),
          method: METHODS.STREAM_START,
          path: "/meh",
          data: null,
        }).then(function(messageState){
          return new Promise(function(res){
            setTimeout(function(){
              res(messageState);
            }, 200);
          });
        }).then(function(messageState){
          tr.ok(messageState.isEnded, "router had no problems");
          tr.notOk(messageState.error, "did not error");
          tr.equal(values.length, 2, "The correct number of values were recieved");
          tr.equal(values[0].method, METHODS.STREAM_PART, "first method is stream part");
          tr.equal(values[0].data, testData, "first data is correct");
          tr.equal(values[1].method, METHODS.STREAM_END, "second method is stream end");
          tr.end();
        });
      });
    });
    tv.end();
  });
  tt.test("writing data", function(tv){
    tv.test("can write data multiple times", function(tr){
      var testData = [{}, {}, {}];
      var values = [];
      var routeDup = new Duplex();
      routeDup.on("data", function(val){
        values.push(val);
      });
      routeDup.onStream("/meh", function(data, responder){
        return Promise.all(testData.map(function(data){
          return writeToStream(responder, data);
        }));
      });
      return routeDup.routeMessage({
        id: Date.now().toString(),
        method: METHODS.STREAM_START,
        path: "/meh",
        data: null,
      }).then(function(messageState){
        return new Promise(function(res){
          setTimeout(function(){
            res(messageState);
          }, 200);
        });
      }).then(function(messageState){
        tr.notOk(messageState.isEnded, "router did not end");
        tr.notOk(messageState.error, "did not error");
        tr.equal(values.length, 3, "The correct number of values were recieved");
        values.forEach(function(msg, i){
          tr.equal(msg.method, METHODS.STREAM_PART, "method " + i + " is stream part");
          tr.equal(msg.data, testData[i], "data " + i + " is correct");
        });
        tr.end();
      });
    });
    tv.test("can from multiple routes", function(tr){
      var testData = [{}, {}, {}];
      var values = [];
      var routeDup = new Duplex();
      routeDup.on("data", function(val){
        values.push(val);
      });
      routeDup.onStream("/meh", function(data, responder){
        return writeToStream(responder, testData[0]);
      });
      routeDup.onStream("/meh", function(data, responder){
        responder.end(testData[1]);
      });
      routeDup.onStream("/meh", function(data, responder){
        return writeToStream(responder, testData[2]);
      });
      return routeDup.routeMessage({
        id: Date.now().toString(),
        method: METHODS.STREAM_START,
        path: "/meh",
        data: null,
      }).then(function(messageState){
        return new Promise(function(res){
          setTimeout(function(){
            res(messageState);
          }, 200);
        });
      }).then(function(messageState){
        tr.ok(messageState.isEnded, "router ended");
        tr.notOk(messageState.error, "did not error");
        tr.equal(values.length, 3, "The correct number of values were recieved");
        values.slice(0, 2).forEach(function(msg, i){
          tr.equal(msg.method, METHODS.STREAM_PART, "method " + i + " is stream part");
          tr.equal(msg.data, testData[i], "data " + i + " is correct");
          tr.equal(msg.error, false, "data " + i + " is not an error");
        });
        tr.notOk(values.some(function(val){
          return val.data === testData[2];
        }), "test data 2 is was skipped");
        tr.equal(values[2].method, METHODS.STREAM_END, "method 2 is stream end");
        tr.end();
      });
    });
    tv.end();
  });
  tt.test("remote commands", function(tv){
    tv.test("can recieve data", function(tr){
      var id = Date.now().toString();
      var testData = [{}, {}, {}];
      var recieved = [];
      var routeDup = new Duplex();
      routeDup.onStream("/meh", function(initdata, responder){
        responder.on("data", function(data){
          recieved.push(data);
        });
      });
      routeDup.onStream("/meh", function(initdata, responder){
        responder.on("data", function(data){
          recieved.push(data);
        });
        responder.capture();
      });
      routeDup.onStream("/meh", function(data, responder){
        responder.on("data", function(data){
          recieved.push(data);
        });
      });
      return routeDup.routeMessage({
        id: id,
        method: METHODS.STREAM_START,
        path: "/meh",
        data: null,
      }).then(function(){
        return Promise.all(testData.map(function(data){
          routeDup.routeMessage({
            id: id,
            method: METHODS.STREAM_PART,
            path: "/meh",
            data: data,
          });
        }));
      }).then(function(){
        return new Promise(function(res){
          setTimeout(function(){
            res();
          }, 200);
        });
      }).then(function(){
        tr.equal(recieved.length, 6, "The correct number of values were recieved");
        recieved.forEach(function(msg, i){
          tr.equal(msg, testData[Math.floor(i/2)], "data " + i + " is correct");
        });
        tr.end();
      });
    });
    tv.test("can recieve end", function(tr){
      var id = Date.now().toString();
      var didEnd = false;
      var recData = [];
      var routeDup = new Duplex();
      routeDup.onStream("/meh", function(initdata, responder){
        responder.on("data", function(item){
          recData.push(item);
        });
        responder.on("end", function(){
          didEnd = true;
        });
        responder.capture();
      });
      return routeDup.routeMessage({
        id: id,
        method: METHODS.STREAM_START,
        path: "/meh",
        data: null,
      }).then(function(){
        return routeDup.routeMessage({
          id: id,
          method: METHODS.STREAM_END,
          path: "/meh",
          data: null,
        });
      }).then(function(){
        return new Promise(function(res){
          setTimeout(function(){
            res();
          }, 200);
        });
      }).then(function(){
        tr.equal(recData.length, 0, "no data was recieved");
        tr.equal(didEnd, true, "recieved end event from remote");
        tr.end();
      });
    });
    tv.end();
  });
  tt.end();
});
tap.end && tap.end();
