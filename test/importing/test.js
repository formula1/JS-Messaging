var tap = require("tap");
var child_process = require("child_process");
var path = require("path");

var webdriver = require("selenium-webdriver");
var browserLifeCycle = require("./helpers/selenium-setup/life-cycle");

var fileserverurl = "http://fileserver:80";

var logging = webdriver.logging;
var pref = new logging.Preferences();
pref.setLevel(logging.Type.BROWSER, logging.Level.SEVERE);

var __root = path.resolve(__dirname, "../../");

tap.test("can require", function(t){
  child_process.execSync(`node ${path.join(__dirname, "./environments/commonjs.js")}`);
  t.pass("require was resolved");
  t.pass("successfully constructed");
  t.end();
});

tap.test("can import", function(t){
  if(path.basename(__root) !== "Messenger"){
    throw new Error("Cannot import due to folder name being different");
  }
  var __es6path = path.join(__dirname, "./environments/es6imports.js");
  t.test("in babel-node", function(tb){
    child_process.execSync(
      `${__root}/node_modules/.bin/babel-node --presets es2015 ${__es6path}`,
      { cwd: path.resolve(__root, "../") }
    );
    tb.end();
  });
  t.test("in ts-node", function(ts){
    child_process.execSync(
      `${__root}/node_modules/.bin/ts-node ${__es6path}`,
      { cwd: path.resolve(__root, "../") }

    );
    ts.end();
  });
  t.end();
});

tap.test("standalone applies globals", function(t){
  t.test("in node", function(tn){
    child_process.execSync(`node ${path.join(__dirname, "./environments/standalone.node.js")}`);
    tn.pass("successfully constructed");
    tn.end();
  });
  t.test("in browser", function(tb){
    return browserLifeCycle.require().then(function(){
      return tb.test("firefox", function(tbf){
        var driver = new webdriver.Builder()
            .forBrowser("firefox")
            .setLoggingPrefs(pref)
            .usingServer("http://localhost:4444/wd/hub")
            .build();
        return runBrowserTests(driver, tbf);
      });
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
      return browserLifeCycle.release();
    }).then(function(){
      tb.end();
    });
  });
  t.end();
});

tap.end();

function runBrowserTests(driver, t){
  return driver.then(function(){
    return t.test("main thread", function(tm){
      return runUrl(driver, tm, fileserverurl + "/test/environments/standalone.mainthread.html");
    });
  }).then(function(){
    return t.test("webworker thread", function(tm){
      return runUrl(driver, tm, fileserverurl + "/test/environments/standalone.webworker.html");
    });
  }).then(function(){
    return t.test("sharedworker thread", function(tm){
      return runUrl(driver, tm, fileserverurl + "/test/environments/standalone.sharedworker.html");
    });
  }).then(function(){
    t.end();
  });
}

function runUrl(driver, tm, url){
  return driver.get(url)
  .then(function(){
    return driver.manage().timeouts().pageLoadTimeout(10 * 1000);
  }).then(function(){
    return driver.manage().logs().get("browser").catch(function(err){
      if(
        /UnsupportedOperationError\: POST \/session\/[0-9a-f\-]+\/log did not match a known command/
        .test(err.toString())
      ){
        return [];
      }
      throw err;
    }).then((logs) =>{
      logs.forEach(function(log){
        return tm.threw(log.message);
      });
      tm.pass("No errors on load");
    });
  }).then(function(){
    return driver.executeAsyncScript(
      "".concat(
        "var callback = arguments[arguments.length - 1];",
        "window.start().then(function(){ callback(); }, callback)"
      )
    );
  }).then(function(){
    tm.pass("No errors on run");
    tm.end();
  });
}
