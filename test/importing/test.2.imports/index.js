var tap = require("tape");
var child_process = require("child_process");
var path = require("path");

var fs = require("fs");
var browserify = require("browserify");
var Promise = require("es6-promise");

var __root = path.resolve(__dirname, "../../../");

var __es6path = path.join(__dirname, "./es6imports.js");
tap.test("in babel-node", function(tb){
  child_process.execSync(
    `${__root}/node_modules/.bin/babel-node --presets es2015 ${__es6path}`,
    { cwd: path.resolve(__root, "../") }
  );
  tb.end();
});

var __bundle = path.join(__dirname, "../public/hidden.js");
tap.test("can browserify", { bail: true }, function(t){
  return new Promise(function(res, rej){
    var b = browserify();
    b.require(__es6path, { expose: "start-fn" });
    b.transform("babelify", { presets: ["es2015"] })
    .bundle().pipe(fs.createWriteStream(__bundle))
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
