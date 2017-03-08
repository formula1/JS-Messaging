/* globals MessageDuplex */
var path = require("path");
var __root = path.resolve(__dirname, "../../..");
require(path.join(__root, "./dist/standalone"));

new MessageDuplex();
