var serveScript = require("serve-script");
var http = require("http");
var browserify = require("browserify");
var fs = require("fs");
var path = require("path");

var __coverage = path.resolve(
  __dirname,
  "../coverage"
);
var b = browserify();
fs.readdirSync(__coverage).forEach(function(file){
  b.add(path.join(__coverage, file));
});
b.bundle(function(err, buff){
  if(err) throw err;
  var server = http.createServer(serveScript({ src: buff }));
  server.listen(8080);
});
