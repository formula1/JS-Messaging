var imported = require("./es5");
module.exports = imported.default;
Object.keys(imported).forEach(function(key){
  module.exports[key] = imported[key];
});
