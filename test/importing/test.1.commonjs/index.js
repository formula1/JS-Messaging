var tap = require("tape");
var path = require("path");

var child_process = require("child_process");
var browserify = require("browserify");
var fs = require("fs");
var Promise = require("es6-promise");

tap.test("can require", function(t){
  child_process.execSync(`node ${path.join(__dirname, "./commonjs.js")}`);
  t.pass("require was resolved");
  t.pass("successfully constructed");
  t.end();
});

var __bundle = path.join(__dirname, "../public/hidden.js");
tap.test("can browserify", { bail: true }, function(t){
  return new Promise(function(res, rej){
    var b = browserify();
    b.require(path.join(__dirname, "./commonjs.js"), { expose: "start-fn" });
    b.bundle().pipe(fs.createWriteStream(__bundle))
    .on("finish", res)
    .on("error", rej);
  }).then(function(){
    t.pass("browserify had no errors");
    t.ok(fs.existsSync(__bundle), "file exists");
    child_process.execSync(`node ${__bundle}`);
    t.pass("bundle can be executed in node");
    t.end();
  });
});

var setupBrowsers = require("../helpers/setup-browser").setup;
var runBrowserTests = require("../helpers/run-browser-tests");
tap.test("in browser", function(tb){
  var browsernames = ["chrome", "firefox"];
  return Promise.all(browsernames.map(setupBrowsers)).then(function(drivers){
    tb.plan(browsernames.length);
    drivers.forEach(function(driver, i){
      tb.test(browsernames[i], function(tbb){
        return runBrowserTests(driver, tbb);
      });
    });
  });
});
tap.onFinish(function(){
  fs.unlinkSync(__bundle);
});
