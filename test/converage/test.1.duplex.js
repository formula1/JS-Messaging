var tap = require("tap");
var path = require("path");
var __root = path.resolve(__dirname, "../..");
var mainLocation = require(path.join(__root + "/package.json")).main;
var Duplex = require(path.join(__root, mainLocation));
var METHODS = Duplex.METHODS;

tap.test("Duplex", function(t){
  t.test("can construct", { bail: true }, function(tt){
    new Duplex();
    tt.pass("constructed without errors");
    tt.end();
  });
  t.test("can destroy", function(tt){
    var duplex = new Duplex();
    duplex.destroy();
    tt.pass("destroyed without errors");
    tt.end();
  });
  t.test("destroy emits events", function(tt){
    var duplex = new Duplex();
    var listeners = ["destroy", "finish", "end"];
    var successful = new Set();
    var recData = [];
    return new Promise(function(res, rej){
      duplex.on("data", function(data){
        recData.push(data);
      });
      listeners.map(function(key){
        duplex.on(key, function(){
          if(successful.has(key)){
            return rej("duplicate event " + key);
          }
          successful.add(key);
        });
      });
      duplex.destroy();
      res();
    }).then(function(){
      tt.equal(recData.length, 0, "No data was recieved");
      listeners.forEach(function(key){
        tt.ok(successful.has(key), "event " + key + " was fired");
      });
      tt.end();
    });
  });
  t.test("destroy doesn't emit end while still have values in buffer", function(tt){
    var duplex = new Duplex();
    var listeners = ["destroy", "finish"];
    var recData = [];
    var notOkListeners = ["end"];
    var successful = new Set();
    var toPush = "example";
    duplex.push(toPush);
    return new Promise(function(res, rej){
      listeners.concat(notOkListeners).map(function(key){
        duplex.on(key, function(){
          if(successful.has(key)){
            return rej("duplicate event " + key);
          }
          successful.add(key);
        });
      });
      duplex.destroy();
      res();
    }).then(function(){
      listeners.forEach(function(key){
        tt.ok(successful.has(key), "event " + key + " was fired");
      });
      notOkListeners.forEach(function(key){
        tt.notOk(successful.has(key), "event " + key + " was fired before buffer was empty");
      });
      duplex.on("data", function(data){
        recData.push(data);
      });
      return new Promise(function(res){
        setTimeout(res, 200);
      });
    }).then(function(){
      tt.equal(recData.length, 1, "one item was added");
      tt.equal(recData[0], toPush, "item is as expected");
      notOkListeners.forEach(function(key){
        tt.ok(successful.has(key), "event " + key + " was fired after buffer was empty");
      });
      tt.end();
    });
  });
  t.test("should not destroy twice", function(tt){
    var duplex = new Duplex();
    var count = 0;
    duplex.on("destroy", function(){
      count++;
    });

    duplex.destroy();
    duplex.destroy();
    tt.equal(count, 1, "destroy event only happened once");
    tt.end();
  });
  t.test("write", function(tt){
    tt.test("routing", function(tr){
      var routeDup = new Duplex();
      var expectedValue = {};
      var recievedValue = false;
      routeDup.onRequest("/meh", function(data, responder){
        recievedValue = data;
        responder.resolve();
      });
      return Promise.resolve(routeDup.write({
        id: Date.now().toString(),
        method: METHODS.REQUEST,
        path: "/meh",
        data: expectedValue,
      })).then(function(){
        tr.equal(recievedValue, expectedValue, "Recieved Value is correct");
        tr.end();
      });
    });
    tt.test("returning", function(tr){
      var routeDup = new Duplex();
      var expectedRec = {};
      var recievedValue = false;
      var expectedRes = {};
      var respondedValue = false;
      routeDup.on("data", function(message){
        recievedValue = message.data;
        routeDup.write({
          id: message.id,
          method: METHODS.REQUEST,
          path: "/meh",
          data: expectedRes,
        });
      });
      return routeDup.request("/meh", expectedRec).then(function(data){
        respondedValue = data;
      }).then(function(){
        tr.equal(recievedValue, expectedRec, "Recieved Value is correct");
        tr.equal(respondedValue, expectedRes, "Responded Value is correct");
        tr.end();
      });
    });
    tt.test("error", function(tr){
      var routeDup = new Duplex();
      var expectedRec = [{}, {}];
      var recievedValue = [];
      var expectedRes = [{}, {}];
      var respondedValue = [];
      routeDup.on("data", function(message){
        respondedValue.push(message.data);
      });
      routeDup.onRequest("/error", function(data, responder){
        recievedValue.push(data);
        return new Promise(function(res){
          setTimeout(res, 100);
        }).then(function(){
          throw new Error("an error");
        }).then(function(){
          responder.resolve(expectedRes[0]);
        });
      });
      routeDup.onRequest("/not-error", function(data, responder){
        recievedValue.push(data);
        responder.resolve(expectedRes[1]);
      });
      return Promise.all([
        routeDup.write({
          id: Date.now().toString(),
          method: METHODS.REQUEST,
          path: "/error",
          data: expectedRec[0],
        }),
        routeDup.write({
          id: Date.now().toString(),
          method: METHODS.REQUEST,
          path: "/not-error",
          data: expectedRec[1],
        })
      ]).then(function(){
        return new Promise(function(res){
          setTimeout(res, 200);
        });
      }).then(function(){
        tr.pass("no errors occured emitted");
        tr.equal(recievedValue.length, 2, "Recieved 2 values");
        expectedRec.forEach(function(exp, i){
          tr.equal(recievedValue[i], exp, "Recieved Value correct values in correct order");
        });
        tr.equal(respondedValue.length, 1, "only one response occured");
        tr.equal(respondedValue[0], expectedRes[1], "only the second value was sent");
        tr.end();
      });
    });
    tt.end();
  });
  t.end();
});
tap.end();
