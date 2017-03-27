var tap = require("tape");
var Duplex = require("../../dist/node");
var METHODS = Duplex.METHODS;

tap.test("routing", function(t){
  var routeTypes = [METHODS.TRIGGER, METHODS.REQUEST, METHODS.STREAM_START];
  var routeTypeToMethod = {
    [METHODS.TRIGGER]: "trigger",
    [METHODS.REQUEST]: "request",
    [METHODS.STREAM_START]: "stream",
  };
  routeTypes.forEach(function(routeType){
    var method = routeTypeToMethod[routeType];
    t.test(routeType, function(tt){
      tt.test("can use", function(tl){
        var expectedPath = "/meh";
        var expectedData = {};
        var routeDup = new Duplex();
        return new Promise(function(res, rej){
          routeDup.on("data", function(data){
            res(data);
          });
          setTimeout(function(){
            rej("timed out");
          }, 200);
          routeDup[method](expectedPath, expectedData);
        }).then(function(message){
          tl.pass("method successfully used");
          tl.equal(message.path, expectedPath, "path is as expected");
          tl.equal(message.data, expectedData, "data is as expected");
          tl.equal(message.method, routeType, "method is as expected");
          tl.end();
        });
      });
      tt.end();
    });
  });
  t.test("abortables", function(td){
    var abortTypes = [METHODS.REQUEST, METHODS.STREAM_START];
    abortTypes.forEach(function(routeType){
      td.test(routeType, function(tt){
        var method = routeTypeToMethod[routeType];
        tt.test("can abort", function(tr){
          var expectedData = {};
          var expectedPath = "/meh";
          var recievedValues = [];
          var routeDup = new Duplex();
          return new Promise(function(res){
            routeDup.on("data", function(data){
              recievedValues.push(data);
            });
            setTimeout(function(){
              res();
            }, 200);
            var methodRet = routeDup[method](expectedPath, expectedData);
            methodRet.abort();
          }).then(function(){
            tr.pass("method successfully used");
            tr.equal(recievedValues.length, 2, "should have recieved 2 messages");
            tr.equal(recievedValues[0].path, expectedPath, "path is as expected");
            tr.equal(recievedValues[0].data, expectedData, "data is as expected");
            tr.equal(recievedValues[0].method, routeType, "method is as expected");
            tr.equal(recievedValues[1].path, expectedPath, "path is as expected");
            tr.equal(recievedValues[1].method, METHODS.ABORT, "method is as expected");
            tr.equal(recievedValues[1].id, recievedValues[0].id, "should have identical ids");
            tr.end();
          });
        });
        tt.end();
      });
    });
    td.end();
  });
  t.end();
});
tap.end && tap.end();
