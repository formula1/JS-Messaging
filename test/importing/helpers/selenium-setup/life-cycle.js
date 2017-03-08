var child_process = require("child_process");
var path = require("path");
var split = require("split");
var REQUIRED_MESSAGES = [
  /^hub.*Selenium Grid hub is up and running$/,
  /^chrome.*The node is registered to the hub and ready to use$/,
  /^firefox.*The node is registered to the hub and ready to use$/
];

var stillRequiring = 0;
module.exports.require = function(){
  return create(createBrowserContext).then(function(){
    stillRequiring++;
  });
};

module.exports.release = function(){
  if(stillRequiring === 0){
    Promise.reject(new Error("relaeseing when no longer required"));
  }
  stillRequiring--;
  if(stillRequiring.length > 0){
    return Promise.resolve();
  }
  return destroy(destroyBrowserContext);
};

function createBrowserContext(){
  return new Promise(function(res, rej){
    var child = child_process.spawn(
      "docker-compose",
      ["-f", path.join(__dirname, "docker-compose.yml"), "up", "--force-recreate"],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    var to;
    var missing = REQUIRED_MESSAGES.slice(0);
    var outsplitter = split();
    var errsplitter = split();
    child.stderr.pipe(errsplitter).on("data", function(){
      // var message = buffer.toString("utf-8");
      // console.error("ERROR", message);
    });
    child.stdout.pipe(outsplitter).on("data", function(buffer){
      var message = buffer.toString("utf-8");

      // console.log(message);
      for(var i = 0, l = missing.length; i < l; i++){
        if(missing[i].test(message)){
          break;
        }
      }
      if(i < l){
        missing.splice(i, 1);
        if(missing.length === 0){
          clearTimeout(to);
          child.stdout.unpipe(outsplitter);
          child.stdout.pipe(split()).on("data", function(){
            // var message = buffer.toString("utf-8");
            // console.error(message);
          });
          res(child);
        }
      }
    });
    to = setTimeout(function(){
      child.stdout.unpipe();
      rej(new Error("timed out"));
    }, 30*1000);
  });
}

function destroyBrowserContext(context){
  var child = context;
  var timeoutlimit = 30 * 1000;
  return new Promise(function(res, rej){
    try{
      child.on("exit", function(){
        res();
      });
      setTimeout(function(){
        rej("kill timed out");
      }, timeoutlimit);
      child.kill();
      child.kill();
    }catch(e){
      rej(e);
    }
  });
}

var currentContext = false;
var isCreating = false;
var currentlyDestroying = false;
var destroyListeners = [];
var createListeners = [];
function create(fn){
  return new Promise(function(res, rej){
    if(!currentlyDestroying) return res();
    destroyListeners.push([res, rej]);
  }).then(function(){
    return new Promise(function(res, rej){
      if(currentContext !== false){
        return res();
      }
      createListeners.push([res, rej]);
      if(isCreating){
        return;
      }
      isCreating = true;
      fn().then(function(results){
        currentContext = results;
        isCreating = false;
        var listeners = createListeners;
        createListeners = [];
        listeners.forEach(function(resrej){
          resrej[0]();
        });
      }, function(err){
        isCreating = false;
        var listeners = createListeners;
        createListeners = [];
        listeners.forEach(function(resrej){
          resrej[1](err);
        });
      });
    });
  });
}

function destroy(fn, timeoutlimit){
  if(currentContext === false){
    return Promise.resolve();
  }
  currentlyDestroying = true;
  timeoutlimit = timeoutlimit || 1500;
  return Promise.race([
    Promise.resolve(currentContext).then(fn),
    new Promise(function(res){ setTimeout(res, timeoutlimit); }),
  ]).then(function(){
    currentlyDestroying = false;
    currentContext = false;
    var listeners = destroyListeners;
    destroyListeners = [];
    listeners.forEach(function(resrej){
      resrej[0]();
    });
  }, function(err){
    currentlyDestroying = false;
    var listeners = destroyListeners;
    destroyListeners = [];
    listeners.forEach(function(resrej){
      resrej[1](err);
    });
  });
}
