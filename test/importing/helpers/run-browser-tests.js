var __environmentsDir = "/test/importing/";
var fileserverurl = "http://fileserver:80";

function formatFileToUrl(file){
  return fileserverurl + __environmentsDir + "/" + file;
}

module.exports = function runBrowserTests(driver, t){
  return driver.then(function(){
    return t.test("main thread", function(tm){
      return runUrl(driver, tm, formatFileToUrl("mainthread.html"));
    });
  }).then(function(){
    return t.test("webworker thread", function(tm){
      return runUrl(driver, tm, formatFileToUrl("webworker.html"));
    });
  }).then(function(){
    return t.test("sharedworker thread", function(tm){
      return runUrl(driver, tm, formatFileToUrl("sharedworker.html"));
    });
  }).then(function(){
    t.end();
  });
};

function runUrl(driver, tm, url){
  return driver.get(url)
  .then(function(){
    return driver.manage().timeouts().pageLoadTimeout(30 * 1000);
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
