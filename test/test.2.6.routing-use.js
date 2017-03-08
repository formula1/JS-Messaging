var tap = require("tap");
var path = require("path");
var __root = path.resolve(__dirname, "..");
var mainLocation = require(path.join(__root + "/package.json")).main;
var Duplex = require(path.join(__root, mainLocation));

var METHODS = Duplex.METHODS;
var LISTENABLE_METHODS = [METHODS.TRIGGER, METHODS.REQUEST, METHODS.STREAM_START];

tap.test("use", function(tt){
  var routeDup;
  tt.beforeEach(function(){
    return Promise.resolve().then(function(){
      routeDup = new Duplex();
    });
  });

  LISTENABLE_METHODS.forEach(function(method){
    tt.test("can receive event", function(tre){
      tre.beforeEach(function(){
        return Promise.resolve().then(function(){
          routeDup = new Duplex();
        });
      });
      [
        { name: "stringpath", path: "/meh" },
        { name: "regexp", path: /^\/meh$/ },
      ].forEach(function(testInfo){
        tre.test(testInfo.name, function(tr){
          var path = testInfo.path;

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
tap.end();
