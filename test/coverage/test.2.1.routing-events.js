var tap = require("tape");
var Duplex = require("../../dist/node");

var METHODS = Duplex.METHODS;

tap.test("events", function(tt){
  tt.test("can capture event", function(tr){
    var expectedValue = {};
    var recievedValue = false;
    var dup1Value = false;
    var dup2Value = false;
    var dup3Value = false;
    var routeDup = new Duplex();
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
    var routeDup = new Duplex();
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
tap.end && tap.end();
