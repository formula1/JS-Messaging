var fileserverurl = "http://fileserver";
var Promise = require("es6-promise");

function formatFileToUrl(file){
  return fileserverurl + "/" + file;
}

module.exports = function runBrowserTests(driver, t){
  t.on("end", function(){
    driver.quit();
  });
  t.test("main thread", function(tm){
    return runUrl(driver, tm, formatFileToUrl("mainthread.html"));
  });
  t.test("webworker thread", function(tm){
    return runUrl(driver, tm, formatFileToUrl("webworker.html"));
  });
  t.test("sharedworker thread", function(tm){
    return runUrl(driver, tm, formatFileToUrl("sharedworker.html"));
  });

  // TODO: Test service worker
  // t.test("serviceworker thread", function(tm){
  //   return runUrl(driver, tm, formatFileToUrl("serviceworker.html"));
  // });
  t.end();
};

function runUrl(driver, tm, url){
  return driver.get(url)
  .then(function(){
    return waitForLoad(driver);
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
        throw log.message;
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
  }).then(function(err){
    tm.notOk(err, "No errors on run");
    tm.end();
  });
}

function waitForLoad(driver){
  return Promise.race([
    new Promise(function(res){ setTimeout(res, 30000); }).then(function(){
      throw new Error("timed out");
    }),
    driver.executeAsyncScript(
      `
        var callback = arguments[arguments.length - 1];
        if(document.readyState == 'complete'){
          callback();
        } else {
          window.addEventListener(\"load\", function(){ callback() })
        }
      `
    )
  ]);

  // return driver.manage().timeouts().pageLoadTimeout(30 * 1000);
  // return driver.wait(until.elementLocated(By.id("footer")), 10000);
}
