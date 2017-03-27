var Promise = require("es6-promise");
var tap = require("tape");
var Duplex = require("../../dist/node");
var util = require("../util");
var delay = util.delay;
var METHODS = Duplex.METHODS;

var routeTypeToMethod = {};
routeTypeToMethod[METHODS.TRIGGER] = "onTrigger";
routeTypeToMethod[METHODS.REQUEST] = "onRequest";
routeTypeToMethod[METHODS.STREAM_START] = "onStream";

var abortTypes = [METHODS.REQUEST, METHODS.STREAM_START];
var writeMethods = {};
writeMethods[METHODS.REQUEST] = "resolve";
writeMethods[METHODS.STREAM_START] = "write";

tap.test("aborting", function(td){
  abortTypes.forEach(function(routeType){
    td.test(routeType, function(tt){
      var method = routeTypeToMethod[routeType];
      var writeMethod = writeMethods[routeType];
      tt.test("cannot create two abortables with the same id at the same time", function(tr){
        var expectedValue = {};
        var recievedValue = false;
        var expectedResp = {};
        var respValues = [];
        var id = Date.now().toString();
        var routeDup = new Duplex();
        routeDup.on("data", function(msg){
          respValues.push(msg);
        });
        routeDup[method]("/meh", function(data, responder){
          recievedValue = data;
          return delay(200).then(function(){
            return responder[writeMethod](expectedResp);
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
            tr.equal(respValues.length, 1, "recieved a response despite error");
            tr.equal(respValues[0].data, expectedResp, "response data is as expected");
          }),
          routeDup.routeMessage({
            id: id,
            method: routeType,
            path: "/meh",
            data: expectedValue,
          }).then(function(){
            throw new Error("An error should have been thrown");
          }, function(error){
            tr.pass("an error was thrown");
            tr.ok(error, "error exists");
          }),
        ]).then(function(){
          tr.end();
        }).catch(function(err){
          tr.fail(err.toString());
        });
      });
      tt.test("can create two abortables with the same id different times", function(tr){
        var expectedValue = {};
        var recievedValues = [];
        var expectedResp = {};
        var respValues = [];
        var id = Date.now().toString();
        var routeDup = new Duplex();
        routeDup.on("data", function(msg){
          respValues.push(msg);
        });
        routeDup[method]("/meh", function(data, responder){
          recievedValues.push(data);
          responder[writeMethod](expectedResp);
        });
        return routeDup.routeMessage({
          id: id,
          method: routeType,
          path: "/meh",
          data: expectedValue,
        }).then(function(){
          return delay(200);
        }).then(function(){
          tr.equal(recievedValues.length, 1, "number recieved is correct");
          tr.equal(recievedValues[0], expectedValue, "Value is correct");
          tr.equal(respValues.length, 1, "recieved a response");
          tr.equal(respValues[0].data, expectedResp, "response data is as expected");
          return routeDup.routeMessage({
            id: id,
            method: routeType,
            path: "/meh",
            data: expectedValue,
          });
        }).then(function(){
          return delay(200);
        }).then(function(){
          tr.equal(recievedValues.length, 2, "number recieved is correct");
          tr.equal(recievedValues[1], expectedValue, "Value is correct");
          tr.equal(respValues.length, 2, "recieved a response despite error");
          tr.equal(respValues[1].data, expectedResp, "response data is as expected");
          tr.end();
        });
      });
      tt.test("aborting captures event", function(tr){
        var expectedValue = {};
        var recievedValue = false;
        var dup1Value = false;
        var routeDup = new Duplex();
        routeDup[method]("/meh", function(data, responder){
          recievedValue = data;
          responder.abort();
        });
        routeDup[method]("/meh", function(data){
          dup1Value = data;
        });
        return routeDup.routeMessage({
          id: Date.now().toString(),
          method: routeType,
          path: "/meh",
          data: expectedValue,
        }).then(function(boo){
          tr.ok(boo.isEnded, "router was captured");
          tr.equal(recievedValue, expectedValue, "Value is correct");
          tr.notOk(dup1Value, "Duplicate1 is skipped");
          tr.end();
        });
      });
      tt.test("multiple calls does not produce errors", function(tr){
        var expectRecValue = {};
        var recievedValue = false;
        var routeDup = new Duplex();
        routeDup[method]("/meh", function(data, responder){
          recievedValue = data;
          responder.abort();
          responder.abort();
        });
        return routeDup.routeMessage({
          id: Date.now().toString(),
          method: routeType,
          path: "/meh",
          data: expectRecValue,
        }).then(function(messageState){
          return delay(200).then(function(){
            return messageState;
          });
        }).then(function(messageState){
          tr.ok(messageState.isEnded, "router captured message");
          tr.equal(recievedValue, expectRecValue, "recieved value is correct");
          tr.end();
        });
      });
      tt.test("abort does not respond", function(tr){
        var values = [];
        var routeDup = new Duplex();
        routeDup.on("data", function(val){
          values.push(val.error);
        });
        routeDup[method]("/meh", function(data, responder){
          responder.abort("anything");
        });
        return routeDup.routeMessage({
          id: Date.now().toString(),
          method: routeType,
          path: "/meh",
          data: null,
        }).then(function(messageState){
          return delay(200).then(function(){
            return messageState;
          });
        }).then(function(messageState){
          tr.ok(messageState.isEnded, "router had no problems");
          tr.equal(values.length, 0, "The correct number of values were recieved");
          tr.end();
        });
      });
      tt.test("can recieve abort", function(tr){
        var id = Date.now().toString();
        var values = [];
        var routeDup = new Duplex();
        routeDup.on("data", function(val){
          values.push(val);
        });
        routeDup[method]("/meh", function(){
          return delay(200);
        });
        routeDup[method]("/meh", function(initdata, responder){
          responder[writeMethod]({});
        });
        return Promise.all([
          routeDup.routeMessage({
            id: id,
            method: routeType,
            path: "/meh",
            data: null,
          }),
          routeDup.routeMessage({
            id: id,
            method: METHODS.ABORT,
            path: "/meh",
            data: null,
          }),
        ]).then(function(results){
          return delay(200).then(function(){
            return results;
          });
        }).then(function(messageStates){
          tr.ok(messageStates[0].isEnded, "first message did end");
          tr.notOk(messageStates[0].error, "no error was emitted");
          tr.ok(messageStates[1].isEnded, "second message did end");
          tr.notOk(messageStates[1].error, "no error was emitted");
          tr.equal(values.length, 0, "The correct number of values were recieved");
          tr.end();
        });
      });
      tt.test("writing after abort produces errors", function(tr){
        var expectRecValue = {};
        var recievedValue = false;
        var writeValue = {};
        var respValues = [];
        var routeDup = new Duplex();
        routeDup.on("data", function(msg){
          respValues.push(msg);
        });
        routeDup[method]("/meh", function(data, responder){
          recievedValue = data;
          responder.abort();
          responder[writeMethod](writeValue);
        });
        return routeDup.routeMessage({
          id: Date.now().toString(),
          method: routeType,
          path: "/meh",
          data: expectRecValue,
        }).then(function(){
          throw new Error("an error was expected");
        }, function(messageState){
          tr.pass("threw an error");
          return messageState;
        }).then(function(messageState){
          tr.ok(messageState.isEnded, "router captured message");
          tr.ok(messageState.error, "an error occured");
          tr.equal(recievedValue, expectRecValue, "recieved value is correct");
          tr.equal(respValues.length, 0, "no response value was handled");
          tr.end();
        }).catch(function(err){
          tr.fail(err.toString());
        });
      });
      tt.test("writing after remote abort produces errors", function(tr){
        var expectRecValue = {};
        var recievedValue = false;
        var writeValue = {};
        var respValues = [];
        var id = Date.now().toString(32);
        var routeDup = new Duplex();
        routeDup.on("data", function(msg){
          respValues.push(msg);
        });
        routeDup[method]("/meh", function(data, responder){
          recievedValue = data;
          return delay(200).then(function(){
            responder[writeMethod](writeValue);
          });
        });
        var p = routeDup.routeMessage({
          id: id,
          method: routeType,
          path: "/meh",
          data: expectRecValue,
        });
        routeDup.routeMessage({
          id: id,
          method: METHODS.ABORT,
          path: "/meh",
          data: null,
        });
        return p.then(function(){
          throw new Error("an error was expected");
        }, function(messageState){
          tr.pass("threw an error");
          return messageState;
        }).then(function(messageState){
          tr.ok(messageState.isEnded, "router captured message");
          tr.ok(messageState.error, "an error occured");
          tr.equal(recievedValue, expectRecValue, "recieved value is correct");
          tr.equal(respValues.length, 0, "no response value was handled");
          tr.end();
        }).catch(function(err){
          tr.fail(err.toString());
        });
      });
      tt.end();
    });
  });
  td.end();
});
tap.end && tap.end();
