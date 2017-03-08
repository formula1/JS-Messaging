var tap = require("tap");
var path = require("path");
var __root = path.resolve(__dirname, "..");
var mainLocation = require(path.join(__root + "/package.json")).main;
var Duplex = require(path.join(__root, mainLocation));
var METHODS = Duplex.METHODS;

tap.test("request", function(tt){
  tt.test("async resolve", function(tr){
    var routeDup = new Duplex();
    var p;
    var expectedPath = "/meh";
    var expectedRec = {};
    var expectedRes = {};
    return new Promise(function(res, rej){
      routeDup.on("data", function(data){
        res(data);
      });
      setTimeout(function(){
        rej("timed out");
      }, 200);
      p = routeDup.request(expectedPath, expectedRec);
    }).then(function(message){
      tr.ok(p instanceof Promise, "returens a promise");
      tr.ok(message.id, "message has an id");
      tr.equal(message.path, expectedPath, "path is as expected");
      tr.equal(message.data, expectedRec, "data is as expected");
      tr.equal(message.method, METHODS.REQUEST, "method is as expected");
      routeDup.returnMessage({
        id: message.id,
        method: METHODS.REQUEST,
        data: expectedRes,
        error: false
      });
      return p.then(function(value){
        tr.pass("successfully resolved");
        tr.equal(value, expectedRes);
        tr.end();
      });
    });
  });
  tt.test("async reject", function(tr){
    var routeDup = new Duplex();
    var p;
    var expectedPath = "/meh";
    var expectedRec = {};
    var expectedRes = {};
    return new Promise(function(res, rej){
      routeDup.on("data", function(data){
        res(data);
      });
      setTimeout(function(){
        rej("timed out");
      }, 200);
      p = routeDup.request(expectedPath, expectedRec);
    }).then(function(message){
      tr.ok(p instanceof Promise, "returens a promise");
      tr.ok(message.id, "message has an id");
      tr.equal(message.path, expectedPath, "path is as expected");
      tr.equal(message.data, expectedRec, "data is as expected");
      tr.equal(message.method, METHODS.REQUEST, "method is as expected");
      routeDup.returnMessage({
        id: message.id,
        method: METHODS.REQUEST,
        data: expectedRes,
        error: true
      });
      return p.then(function(){
        throw new Error("resolved instead of rejected");
      }, function(value){
        tr.pass("successfully rejected");
        tr.equal(value, expectedRes);
        tr.end();
      });
    });
  });

  tt.test("will not handle request its not expecting", function(tr){
    var routeDup = new Duplex();
    var p;
    var expectedPath = "/meh";
    var expectedRec = {};
    var expectedRes = {};
    return new Promise(function(res, rej){
      routeDup.on("data", function(data){
        res(data);
      });
      setTimeout(function(){
        rej("timed out");
      }, 200);
      p = routeDup.request(expectedPath, expectedRec);
    }).then(function(message){
      tr.ok(p instanceof Promise, "returens a promise");
      tr.ok(message.id, "message has an id");
      tr.equal(message.path, expectedPath, "path is as expected");
      tr.equal(message.data, expectedRec, "data is as expected");
      tr.equal(message.method, METHODS.REQUEST, "method is as expected");
      var newID = message.id + "more to be unique";
      tr.notEqual(message.id, newID, "the response id is not the same as the message");
      tr.notOk(routeDup.returnMessage({
        id: newID,
        method: METHODS.REQUEST,
        data: expectedRes,
        error: false
      }), "will not route a message its not expecting");
      return Promise.race([
        p.then(function(){
          throw new Error("should not have resolved");
        }, function(){
          throw new Error("should not have rejected");
        }),
        new Promise(function(res){ setTimeout(res, 200); }),
      ]).then(function(){
        return message;
      });
    }).then(function(message){
      tr.ok(routeDup.returnMessage({
        id: message.id,
        method: METHODS.REQUEST,
        data: expectedRes,
        error: false
      }), "will route a message it is expecting");
      return Promise.race([
        p.then(function(value){
          tr.equal(value, expectedRes);
          tr.end();
        }),
        new Promise(function(res, rej){ setTimeout(function(){ rej("timed out"); }, 200); }),
      ]);
    });
  });
  tt.end();
});
tap.end();
