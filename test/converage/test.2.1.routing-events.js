var tap = require("tap");
var path = require("path");
var __root = path.resolve(__dirname, "../..");
var mainLocation = require(path.join(__root + "/package.json")).main;
var Duplex = require(path.join(__root, mainLocation));

var METHODS = Duplex.METHODS;

tap.test("events", function(tt){
  var routeDup;
  tt.beforeEach(function(){
    return Promise.resolve().then(function(){
      routeDup = new Duplex();
    });
  });
  tt.test("can capture event", function(tr){
    var expectedValue = {};
    var recievedValue = false;
    var dup1Value = false;
    var dup2Value = false;
    var dup3Value = false;
    routeDup.onTrigger("/meh", function(data, responder){
      recievedValue = data;
      responder.capture();
    });
    routeDup.onTrigger("/meh", function(data){
      dup1Value = data;
    });
    routeDup.onTrigger("/meh", function(data){
      dup2Value = data;
    });
    routeDup.onTrigger("/meh", function(data){
      dup3Value = data;
    });
    return routeDup.routeMessage({
      id: Date.now().toString(),
      method: METHODS.TRIGGER,
      path: "/meh",
      data: expectedValue,
    }).then(function(boo){
      tr.ok(boo.isEnded, "router was captured");
      tr.equal(recievedValue, expectedValue, "Value is correct");
      tr.notOk(dup1Value, "Duplicate1 is skipped");
      tr.notOk(dup2Value, "Duplicate2 is skipped");
      tr.notOk(dup3Value, "Duplicate3 is skipped");
      tr.end();
    });
  });
  tt.test("multiple calls produces errors", function(tr){
    var expectRecValue = {};
    var recievedValue = false;
    routeDup.onTrigger("/meh", function(data, responder){
      recievedValue = data;
      responder.capture();
      responder.capture();
    });
    return routeDup.routeMessage({
      id: Date.now().toString(),
      method: METHODS.TRIGGER,
      path: "/meh",
      data: expectRecValue,
    }).then(function(){
      throw new Error("should have produced an error");
    }, function(messageState){
      tr.pass("multiple calls caused an error");
      return messageState;
    }).then(function(messageState){
      tr.ok(messageState.isEnded, "router captured message");
      tr.ok(messageState.error, "error exists on messageState");
      tr.equal(recievedValue, expectRecValue, "recieved value is correct");
      tr.end();
    });
  });
  tt.end();
});
tap.end();
