/* eslint-env node */

var path = require("path");
var __root = path.resolve(__dirname, "../../..");
process.chdir(path.resolve(__root, "../"));

var Duplex = require(__root);
new Duplex();
