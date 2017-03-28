var webdriver = require("selenium-webdriver");

var logging = webdriver.logging;
var pref = new logging.Preferences();
pref.setLevel(logging.Type.BROWSER, logging.Level.SEVERE);

module.exports.setup = function(browsertype){
  var driver = new webdriver.Builder()
      .forBrowser(browsertype)
      .setLoggingPrefs(pref)
      .usingServer("http://localhost:4444/wd/hub")
      .build();
  driver.manage().timeouts().implicitlyWait(30 * 1000);
  driver.manage().timeouts().setScriptTimeout(30 * 1000);
  return driver.then(function(){
    return driver;
  });
};

module.exports.cleanup = function(){

};
