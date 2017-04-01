var path = require("path");
var __root = path.resolve(__dirname, "../..");
var mainLocation = require(path.join(__root + "/package.json")).main;
var MessageDuplex = require(path.join(__root, mainLocation));
var Duplex = require("stream").Duplex;
