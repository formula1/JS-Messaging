var tap = require("tape");
var Duplex = require("../../dist/node");
var Promise = require("es6-promise");
var METHODS = Duplex.METHODS;

tap.test("routing", function(t){
  var routeTypes = [METHODS.TRIGGER, METHODS.REQUEST, METHODS.STREAM_START];
  var routeTypeToMethod = {};

  routeTypeToMethod[METHODS.TRIGGER] = "onTrigger";
  routeTypeToMethod[METHODS.REQUEST] = "onRequest";
  routeTypeToMethod[METHODS.STREAM_START] = "onStream";
  t.test("cannot run invalid methods", function(tr){
    var routeDup = new Duplex();
    return routeDup.routeMessage({
      id: Date.now().toString(),
      method: "definitely-not-a-route-type",
      path: "/meh",
      data: true
    }).then(function(){
      tr.fail("did not throw on invalid method");
    }, function(e){
      tr.pass("threw an error on invalid method");
      tr.ok(/^Invalid method /.test(e.message), "error has correct message");
      tr.end();
    });
  });
  routeTypes.forEach(function(routeType){
    var method = routeTypeToMethod[routeType];
    t.test(routeType, function(tre){
      [
        { name: "stringpath", path: "/meh" },
        { name: "regexp", path: /^\/meh$/ },
      ].forEach(function(testInfo){
        tre.test(testInfo.name, function(tt){
          var path = testInfo.path;
          tt.test("can listen", function(tl){
            var routeDup = new Duplex();

            routeDup[method](path, function(){
            });
            tl.pass("can listen to trigger event");
            tl.end();
          });
          tt.test("listener triggers for correct path", function(tr){
            var didTrigger = false;
            var routeDup = new Duplex();
            routeDup[method](path, function(){
              didTrigger = true;
            });
            return routeDup.routeMessage({
              id: Date.now().toString(),
              method: routeType,
              path: "/meh",
              data: true
            }).then(function(boo){
              tr.notOk(boo.isEnded, "router did not capture");
              tr.ok(didTrigger, "listener recieved");
              tr.end();
            });
          });
          tt.test("can remove route", function(tr){
            var didTrigger = false;
            var routeDup = new Duplex();
            var route = routeDup[method](path, function(){
              didTrigger = true;
            });
            routeDup.removeRoute(route);
            return routeDup.routeMessage({
              id: Date.now().toString(),
              method: routeType,
              path: "/meh",
              data: true
            }).then(function(boo){
              tr.notOk(boo.isEnded, "router did not capture");
              tr.notOk(didTrigger, "listener not recieved");
              tr.equal(routeDup.router.routes.length, 0, "should have no routes");
              tr.end();
            });
          });
          tt.test("wont remove route if non-existant", function(tr){
            var didTrigger = false;
            var routeDup = new Duplex();
            var route = routeDup[method](path, function(){
              didTrigger = true;
            });
            routeDup.removeRoute(false);
            return routeDup.routeMessage({
              id: Date.now().toString(),
              method: routeType,
              path: "/meh",
              data: true
            }).then(function(boo){
              tr.notOk(boo.isEnded, "router did not capture");
              tr.ok(didTrigger, "listener not recieved");
              tr.equal(routeDup.router.routes.length, 1, "should have 1 route");
              tr.equal(routeDup.router.routes[0], route, "should have 1 route");
              tr.end();
            });
          });
          tt.test("other methods do not run listener", function(tr){
            Promise.all(routeTypes.map(function(oType){
              if(oType === routeType){
                return;
              }
              return tr.test(oType, function(trr){

                var oMethod = routeTypeToMethod[oType];
                var badPathTrigger = false;
                var routeDup = new Duplex();
                routeDup[method](path, function(){
                  badPathTrigger = true;
                });
                var didTrigger;
                routeDup[oMethod](path, function(){
                  didTrigger = true;
                });
                return routeDup.routeMessage({
                  id: Date.now().toString(),
                  method: oType,
                  path: "/meh",
                  data: true
                }).then(function(boo){
                  trr.notOk(boo.isEnded, "router did not capture");
                  trr.notOk(badPathTrigger, "wrong method recieved");
                  trr.ok(didTrigger, "correct method[" + oMethod + "] recieved");
                  trr.end();
                });
              });
            })).then(function(){
              tr.end();
            });
          });
          tt.test("wrong path is skipped", function(tr){
            var didTrigger = false;
            var badPathTrigger = false;
            var routeDup = new Duplex();
            routeDup[method](path, function(){
              didTrigger = true;
            });
            routeDup[method]("/not-meh", function(){
              badPathTrigger = true;
            });
            return routeDup.routeMessage({
              id: Date.now().toString(),
              method: routeType,
              path: "/meh",
              data: true
            }).then(function(boo){
              tr.notOk(boo.isEnded, "router did not capture");
              tr.ok(didTrigger, "listener recieved");
              tr.notOk(badPathTrigger, "wrong path rcieved");
              tr.end();
            });
          });
          tt.test("value is correct", function(tr){
            var expectedValue = {};
            var recievedValue = false;
            var routeDup = new Duplex();
            routeDup[method](path, function(data){
              recievedValue = data;
            });
            return routeDup.routeMessage({
              id: Date.now().toString(),
              method: routeType,
              path: "/meh",
              data: expectedValue,
            }).then(function(boo){
              tr.notOk(boo.isEnded, "router did not capture");
              tr.equal(recievedValue, expectedValue, "Value is correct");
              tr.end();
            });
          });
          tt.test("one event runs multiple listeners if no captured", function(tr){
            var expectedValue = {};
            var recievedValue = false;
            var dupValue = false;
            var routeDup = new Duplex();
            routeDup[method](path, function(data){
              recievedValue = data;
            });
            routeDup[method](path, function(data){
              dupValue = data;
            });
            return routeDup.routeMessage({
              id: Date.now().toString(),
              method: routeType,
              path: "/meh",
              data: expectedValue,
            }).then(function(boo){
              tr.notOk(boo.isEnded, "router did not capture");
              tr.equal(recievedValue, expectedValue, "Value is correct");
              tr.equal(dupValue, expectedValue, "Duplicate is correct");
              tr.end();
            });
          });
          tt.end();
        });
      });
      tre.end();
    });
  });
  t.end();
});
tap.end && tap.end();
