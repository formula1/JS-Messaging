var tap = require("tape");
var Duplex = require("../../dist/node");

var METHODS = Duplex.METHODS;
var LISTENABLE_METHODS = [METHODS.TRIGGER, METHODS.REQUEST, METHODS.STREAM_START];

tap.test("use", function(tt){

  LISTENABLE_METHODS.forEach(function(method){
    tt.test("can receive event", function(tre){
      [
        { name: "stringpath", path: "/meh" },
        { name: "regexp", path: /^\/meh$/ },
      ].forEach(function(testInfo){
        tre.test(testInfo.name, function(tr){
          var path = testInfo.path;
          var routeDup = new Duplex();

          var expectedValue = {};
          var recievedValue = false;
          routeDup.use(path, function(data){
            recievedValue = data;
          });
          return routeDup.routeMessage({
            id: Date.now().toString(),
            method: method,
            path: "/meh",
            data: expectedValue,
          }).then(function(boo){
            tr.notOk(boo.isEnded, "router was not captured");
            tr.equal(recievedValue, expectedValue, "Value is correct");
            tr.end();
          });
        });
      });
      tre.end();
    });
    tt.test("can receive all paths", function(tr){
      var expectedValue = {};
      var recievedValue = false;
      var routeDup = new Duplex();
      routeDup.use(function(data){
        recievedValue = data;
      });
      return routeDup.routeMessage({
        id: Date.now().toString(),
        method: method,
        path: Math.random().toString(),
        data: expectedValue,
      }).then(function(boo){
        tr.notOk(boo.isEnded, "router was not captured");
        tr.equal(recievedValue, expectedValue, "Value is correct");
        tr.end();
      });
    });
  });
  tt.end();
});
tap.end && tap.end();
