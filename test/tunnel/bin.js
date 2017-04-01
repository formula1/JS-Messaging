/* eslint-env node */

var mapping = {
  SAUCE_USERNAME: "sauce_username",
  SAUCE_ACCESS_KEY: "sauce_key",
};

var path = require("path");
var indexOfFile = -1;
process.argv.forEach(function(name, i){
  var file = path.resolve(process.cwd(), name);
  if(file === __filename){
    indexOfFile = i;
  }
});
if(indexOfFile === -1){
  throw new Error("arguments unable to be found");
}

var config = require("./config")(mapping);
var startEnd = require("./start-end");
var child_process = require("child_process");
startEnd.start(config, function(err, tunnel){
  if(err) throw err;
  var c = child_process.spawn(
    "node_modules/.bin/zuul",
    ["--sauce-connect", tunnel.id, "--"].concat(process.argv.slice(indexOfFile + 1)),
    {
      cwd: process.cwd(),
      stdio: ["ignore", "inherit", "inherit"],
      env: process.env,
    }
  );
  var exited = false;
  var to = setTimeout(function(){
    throw "timed out";
  }, 2 * 60 * 1000);
  function exitHandler(){
    if(exited) return;
    exited = true;

    // console.log(arguments);
    clearTimeout(to);
    c.removeListener("close", exitHandler);
    process.removeListener("exit", exitHandler);
    process.removeListener("SIGINT", exitHandler);
    process.removeListener("uncaughtException", exitHandler);

    // console.log("exiting tunnel");
    startEnd.end(tunnel);
    c.kill();
  }
  c.on("close", exitHandler.bind(null, { reason: "child" }));
  process.on("exit", exitHandler.bind(null, { reason: "finished" }));

  //catches ctrl+c event
  process.on("SIGINT", exitHandler.bind(null, { reason: "user" }));

  //catches uncaught exceptions
  process.on("uncaughtException", exitHandler.bind(null, { reason: "error" }));

});
