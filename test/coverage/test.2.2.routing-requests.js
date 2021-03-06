var tap = require("tape");
var Duplex = require("../../dist/node");
var util = require("../util");
var delay = util.delay;

var METHODS = Duplex.METHODS;

tap.test("requests", function(tt){
  tt.test("capture request", function(td){
    ["resolve", "reject"].map(function(key){
      return td.test(key, function(tv){
        tv.test("responding captures event", function(tr){
          var expectedValue = {};
          var recievedValue = false;
          var dup1Value = false;
          var routeDup = new Duplex();
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
          var routeDup = new Duplex();
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
            return delay(200).then(function(){
              return messageState;
            });
          }).then(function(messageState){
            tr.ok(messageState.isEnded, "router captured message");
            tr.ok(messageState.error, "error exists on messageState");
            tr.equal(recievedValue, expectRecValue, "recieved value is correct");
            tr.end();
          }).catch(function(err){
            tr.fail(err.toString());
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
          var routeDup = new Duplex();
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
            return delay(200).then(function(){
              return messageState;
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
          var routeDup = new Duplex();
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
            return delay(200).then(function(){
              return messageState;
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
tap.end && tap.end();
