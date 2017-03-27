/* eslint-env node */

var fs = require("fs");
var path = require("path");
var yaml = require("yamljs");

module.exports = function(mapping){
  return mergeConfigs(
    readLocalConfig(),
    mapEnvToConfig(mapping, process.env)
  );
};

function mapEnvToConfig(mapping, env){
  return Object.keys(mapping).reduce(function(config, key){
    if(key in env){
      config[mapping[key]] = env[key];
    }
    return config;
  }, {});
}

function readLocalConfig(){
  var yamlFile = path.join(process.cwd(), ".zuul.yml");
  var jsFile = path.join(process.cwd(), "zuul.config.js");
  var yamlExists = fs.existsSync(yamlFile);
  var jsExists = fs.existsSync(jsFile);
  if(yamlExists && jsExists){
    throw new Error(
      `both .zuul.yaml and zuul.config.js are found in the project directory,
      please choose one`
    );
  }else if(yamlExists){
    return yaml.parse(fs.readFileSync(yamlFile, "utf-8"));
  }else if(jsExists){
    return require(jsFile);
  }else{
    throw new Error(
      `neither .zuul.yaml and zuul.config.js are found in the project directory,
      please choose one`
    );
  }
}

function mergeConfigs(){
  var configs = [].slice.call(arguments, 0);
  return configs.reduce(function(netConfig, propertiesToSet){
    Object.keys(propertiesToSet).forEach(function(key){
      netConfig[key] = propertiesToSet[key];
    });
    return netConfig;
  }, {});
}
