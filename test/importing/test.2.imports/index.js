var tap = require("tape");
var child_process = require("child_process");
var path = require("path");

var fs = require("fs");
var browserify = require("browserify");

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

var webdriver = require("selenium-webdriver");
var runBrowserTests = require("../helpers/run-browser-tests");

var logging = webdriver.logging;
var pref = new logging.Preferences();
pref.setLevel(logging.Type.BROWSER, logging.Level.SEVERE);

tap.test("in browser", function(tb){
  return tb.test("firefox", function(tbf){
    var driver = new webdriver.Builder()
        .forBrowser("firefox")
        .setLoggingPrefs(pref)
        .usingServer("http://localhost:4444/wd/hub")
        .build();
    return runBrowserTests(driver, tbf);
  }).then(function(){
    return tb.test("chrome", function(tbc){
      var driver = new webdriver.Builder()
          .forBrowser("chrome")
          .setLoggingPrefs(pref)
          .usingServer("http://localhost:4444/wd/hub")
          .build();
      return runBrowserTests(driver, tbc);
    });
  }).then(function(){
    tb.end();
  });
}).then(function(){
  fs.unlinkSync(__bundle);
});

tap.end();
