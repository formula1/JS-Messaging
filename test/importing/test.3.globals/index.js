var tap = require("tap");
var child_process = require("child_process");
var path = require("path");

var fs = require("fs");
var browserify = require("browserify");

tap.test("in node", function(tn){
  child_process.execSync(`node ${path.join(__dirname, "./globals.js")}`);
  tn.pass("successfully constructed");
  tn.end();
});
var __bundle = path.join(__dirname, "../hidden.js");

tap.test("can browserify", { bail: true }, function(t){
  return new Promise(function(res, rej){
    var b = browserify();
    b.require(path.join(__dirname, "./globals.js"), { expose: "start-fn" });
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
