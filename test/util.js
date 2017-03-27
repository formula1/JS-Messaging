

module.exports.delay = function(time){
  return new Promise(function(res){
    setTimeout(res, time);
  });
};

module.exports.writeToStream = function(stream, value){
  return new Promise(function(res, rej){
    stream.write(value, function(err){
      if(err){
        rej(err);
      }else{
        res();
      }
    });
  });
};
