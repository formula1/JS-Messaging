var tap = require("tap");
var path = require("path");
var __root = path.resolve(__dirname, "..");
var mainLocation = require(path.join(__root + "/package.json")).main;
var Duplex = require(path.join(__root, mainLocation));

var METHODS = Duplex.METHODS;

tap.test("requests", function(tt){
  var routeDup;
  tt.beforeEach(function(){
    return Promise.resolve().then(function(){
      routeDup = new Duplex();
    });
  });
  tt.test("capture request", function(td){
    ["resolve", "reject"].map(function(key){
      return td.test(key, function(tv){
        tv.test("responding captures event", function(tr){
          var expectedValue = {};
          var recievedValue = false;
          var dup1Value = false;
          routeDup.onRequest("/meh", function(data, responder){
            recievedValue = data;
            responder[key]();
          });
          routeDup.onRequest("/meh", function(data){
            dup1Value = data;
          });
          return routeDup.routeMessage({
            id: Date.now().toString(),
            method: METHODS.REQUEST,
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
          routeDup.onRequest("/meh", function(data, responder){
            recievedValue = data;
            responder[key](1);
            responder[key](1);
          });
          return routeDup.routeMessage({
            id: Date.now().toString(),
            method: METHODS.REQUEST,
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
  tt.test("responses are correct", function(tk){
    var toTest = {
      resolve: false,
      reject: true
    };
    Object.keys(toTest).forEach(function(key){
      tk.test(key, function(tv){
        tv.test("responding push data from the route duplex", function(tr){
          var expectRecValue = {};
          var recievedValue = false;
          var expectResValue = {};
          var values = [];
          routeDup.on("data", function(val){
            values.push(val.data);
          });
          routeDup.onRequest("/meh", function(data, responder){
            recievedValue = data;
            responder[key](expectResValue);
          });
          return routeDup.routeMessage({
            id: Date.now().toString(),
            method: METHODS.REQUEST,
            path: "/meh",
            data: expectRecValue,
          }).then(function(messageState){
            return new Promise(function(res){
              setTimeout(function(){
                res(messageState);
              }, 200);
            });
          }).then(function(messageState){
            tr.ok(messageState.isEnded, "router had no problems");
            tr.equal(recievedValue, expectRecValue, "recieved value is correct");
            tr.equal(values.length, 1, "The correct number of values were recieved");
            tr.equal(values[0], expectResValue, "response value is correct");
            tr.end();
          });
        });
        tv.test("Error value is correct", function(tr){
          var values = [];
          routeDup.on("data", function(val){
            values.push(val.error);
          });
          routeDup.onRequest("/meh", function(data, responder){
            responder[key](null);
          });
          return routeDup.routeMessage({
            id: Date.now().toString(),
            method: METHODS.REQUEST,
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
            tr.equal(values.length, 1, "The correct number of values were recieved");
            tr.equal(values[0], toTest[key], key + " error is correct");
            tr.end();
          });
        });
        tv.end();
      });
    });
    tk.end();
  });
  tt.end();
});
tap.end();
