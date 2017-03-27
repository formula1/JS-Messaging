var tap = require("tape");
var Duplex = require("../../dist/node");
var METHODS = Duplex.METHODS;
var util = require("../util");
var writeToStream = util.writeToStream;
var delay = util.delay;

tap.test("stream", function(tt){
  tt.test("recieving", function(tv){
    tv.test("data from read", function(tr){
      var expectedRess = [{}, {}, {}];
      return initializeDuplexStreamAndMessage(tr).then(function(dsm){
        var routeDup = dsm[0];
        var s = dsm[1];
        var message = dsm[2];
        var errors = [];
        var values = [];
        var didEnd = false;
        s.on("error", function(e){
          errors.push(e);
        });
        s.on("end", function(){
          didEnd = true;
        });
        s.on("readable", function(){
          var val = s.read();
          while(val){
            values.push(val);
            val = s.read();
          }
        });
        expectedRess.forEach(function(expectedRes){
          routeDup.returnMessage({
            id: message.id,
            method: METHODS.STREAM_PART,
            data: expectedRes,
            error: false
          });
        });
        return delay(200).then(function(){
          return [values, errors, didEnd];
        });
      }).then(function(results){
        var values = results[0];
        var errors = results[1];
        var didEnd = results[2];
        tr.equal(errors.length, 0, "recieved no errors");
        tr.notOk(didEnd, "stream has not ended");
        tr.equal(values.length, expectedRess.length, "recieved expected number of responses");
        expectedRess.forEach(function(expectedRes, i){
          tr.equal(values[i], expectedRes, "recieved the correct responses in the right order");
        });
        tr.end();
      });
    });
    tv.test("data", function(tr){
      var expectedRess = [{}, {}, {}];
      return initializeDuplexStreamAndMessage(tr).then(function(dsm){
        var routeDup = dsm[0];
        var s = dsm[1];
        var message = dsm[2];
        return collectStreamDataFromRun(s, function(){
          expectedRess.forEach(function(expectedRes){
            routeDup.returnMessage({
              id: message.id,
              method: METHODS.STREAM_PART,
              data: expectedRes,
              error: false
            });
          });
        });
      }).then(function(results){
        var values = results[0];
        var errors = results[1];
        var didEnd = results[2];
        tr.equal(errors.length, 0, "recieved no errors");
        tr.notOk(didEnd, "stream has not ended");
        tr.equal(values.length, expectedRess.length, "recieved expected number of responses");
        expectedRess.forEach(function(expectedRes, i){
          tr.equal(values[i], expectedRes, "recieved the correct responses in the right order");
        });
        tr.end();
      });
    });

    tv.test("errors", function(tr){
      var expectedRess = [{}, {}, {}];
      return initializeDuplexStreamAndMessage(tr).then(function(dsm){
        var routeDup = dsm[0];
        var s = dsm[1];
        var message = dsm[2];
        return collectStreamDataFromRun(s, function(){
          expectedRess.forEach(function(expectedRes){
            routeDup.returnMessage({
              id: message.id,
              method: METHODS.STREAM_PART,
              data: expectedRes,
              error: true
            });
          });
        });
      }).then(function(results){
        var values = results[0];
        var errors = results[1];
        var didEnd = results[2];
        tr.equal(values.length, 0, "no values should have been emitted");
        tr.notOk(didEnd, "stream has not ended");
        tr.equal(errors.length, expectedRess.length, "recieved expected number of errors");
        expectedRess.forEach(function(expectedRes, i){
          tr.equal(errors[i], expectedRes, "recieved the correct responses in the right order");
        });
        tr.end();
      });
    });

    tv.test("end", function(tr){
      return initializeDuplexStreamAndMessage(tr).then(function(dsm){
        var routeDup = dsm[0];
        var s = dsm[1];
        var message = dsm[2];
        return collectStreamDataFromRun(s, function(){
          routeDup.returnMessage({
            id: message.id,
            method: METHODS.STREAM_END,
            data: null,
            error: false
          });
        });
      }).then(function(results){
        var values = results[0];
        var errors = results[1];
        var didEnd = results[2];
        tr.ok(didEnd, "the stream ended");
        tr.equal(values.length, 0, "no values were sent");
        tr.equal(errors.length, 0, "no values were sent");
        tr.end();
      });
    });
    tv.end();
  });
  tt.test("handeling", function(tv){
    tv.test("will not handle data its not expecting", function(tr){
      var badRes = {};
      var expectedRes = {};
      return initializeDuplexStreamAndMessage(tr).then(function(dsm){
        var routeDup = dsm[0];
        var stream = dsm[1];
        var message = dsm[2];
        var newID = message.id + "more to be unique";
        tr.notEqual(message.id, newID, "the response id is not the same as the message");
        return collectStreamDataFromRun(stream, function(){
          tr.notOk(routeDup.returnMessage({
            id: newID,
            method: METHODS.STREAM_PART,
            data: badRes,
            error: false
          }), "will not route a message its not expecting");
        }).then(function(results){
          var values = results[0];
          var errors = results[1];
          var didEnd = results[2];
          tr.equal(values.length, 0, "no data should have been emitted");
          tr.equal(errors.length, 0, "no errors should have been emitted");
          tr.notOk(didEnd, "end should not have been emitted");
          return collectStreamDataFromRun(stream, function(){
            tr.ok(routeDup.returnMessage({
              id: message.id,
              method: METHODS.STREAM_PART,
              data: expectedRes,
              error: false
            }), "will route a message it is expecting");
          }).then(function(results){
            var values = results[0];
            var errors = results[1];
            var didEnd = results[2];
            tr.equal(values.length, 1, "one value should have been emitted");
            tr.equal(values[0], expectedRes, "no data should have been emitted");
            tr.equal(errors.length, 0, "no errors should have been emitted");
            tr.notOk(didEnd, "end should not have been emitted");
            tr.end();
          });
        });
      });
    });
    tv.test("will not handle errors its not expecting", function(tr){
      var badRes = {};
      var expectedRes = {};
      return initializeDuplexStreamAndMessage(tr).then(function(dsm){
        var routeDup = dsm[0];
        var stream = dsm[1];
        var message = dsm[2];
        var newID = message.id + "more to be unique";
        tr.notEqual(message.id, newID, "the response id is not the same as the message");
        return collectStreamDataFromRun(stream, function(){
          tr.notOk(routeDup.returnMessage({
            id: newID,
            method: METHODS.STREAM_PART,
            data: badRes,
            error: true
          }), "will not route a message its not expecting");
        }).then(function(results){
          var values = results[0];
          var errors = results[1];
          var didEnd = results[2];
          tr.equal(values.length, 0, "no data should have been emitted");
          tr.equal(errors.length, 0, "no errors should have been emitted");
          tr.notOk(didEnd, "end should not have been emitted");
          return collectStreamDataFromRun(stream, function(){
            tr.ok(routeDup.returnMessage({
              id: message.id,
              method: METHODS.STREAM_PART,
              data: expectedRes,
              error: true
            }), "will route a message it is expecting");
          }).then(function(results){
            var values = results[0];
            var errors = results[1];
            var didEnd = results[2];
            tr.equal(values.length, 0, "no data should have been emitted");
            tr.equal(errors.length, 1, "one error should have been emitted");
            tr.equal(errors[0], expectedRes, "no errors should have been emitted");
            tr.notOk(didEnd, "end should not have been emitted");
            tr.end();
          });
        });
      });
    });
    tv.test("will not end an invalid id", function(tr){
      var badRes = {};
      return initializeDuplexStreamAndMessage(tr).then(function(dsm){
        var routeDup = dsm[0];
        var stream = dsm[1];
        var message = dsm[2];
        var newID = message.id + "more to be unique";
        tr.notEqual(message.id, newID, "the response id is not the same as the message");
        return collectStreamDataFromRun(stream, function(){
          tr.notOk(routeDup.returnMessage({
            id: newID,
            method: METHODS.STREAM_END,
            data: badRes,
            error: false
          }), "will not route a message its not expecting");
        }).then(function(results){
          var values = results[0];
          var errors = results[1];
          var didEnd = results[2];
          tr.equal(values.length, 0, "no data should have been emitted");
          tr.equal(errors.length, 0, "no errors should have been emitted");
          tr.notOk(didEnd, "end should not have been emitted");
          return collectStreamDataFromRun(stream, function(){
            tr.ok(routeDup.returnMessage({
              id: message.id,
              method: METHODS.STREAM_END,
              data: null,
              error: false
            }), "will route a message it is expecting");
          }).then(function(results){
            var values = results[0];
            var errors = results[1];
            var didEnd = results[2];
            tr.equal(values.length, 0, "no data should have been emitted");
            tr.equal(errors.length, 0, "no errors should have been emitted");
            tr.ok(didEnd, "end should have been emitted");
            tr.end();
          });
        });
      });
    });
    tv.end();
  });
  tt.test("writing", function(tv){
    tv.test("can write data", function(tr){
      var expectedMessages = [{}, {}, {}];
      return initializeDuplexStreamAndMessage(tr).then(function(dsm){
        var routeDup = dsm[0];
        var stream = dsm[1];
        var message = dsm[2];
        return collectEndDataFromRun(routeDup, stream, function(){
          return Promise.all(expectedMessages.map(function(data){
            return writeToStream(stream, data);
          }));
        }).then(function(results){
          var dupValues = results[0];
          var dupErrors = results[1];
          var strValues = results[2];
          var strErrors = results[3];
          var finishes = results[4];
          var ends = results[5];
          tr.equal(
            dupValues.length, expectedMessages.length,
            "duplex should have sent out messages"
          );
          expectedMessages.forEach(function(data, i){
            var msg = dupValues[i];
            tr.equal(msg.method, METHODS.STREAM_PART, "message should have a stream part method");
            tr.equal(msg.id, message.id, "message id should be the same as the original");
            tr.equal(msg.data, data, "data should be expected");
            tr.equal(msg.error, false, "no error should have been emitted");
          });
          tr.equal(dupErrors.length, 0, "duplex should have no errors");
          tr.equal(strValues.length, 0, "stream should have pushed no values");
          tr.equal(strErrors.length, 0, "stream should have no errors");
          tr.equal(finishes, 0, "stream should not have emitted finish ");
          tr.equal(ends, 0, "stream should not have emitted end");
          tr.end();
        });
      });
    });
    tv.test("cannot write data during remote ends", function(tr){
      var expectedMessages = [{}, {}, {}];
      return initializeDuplexStreamAndMessage(tr).then(function(dsm){
        var routeDup = dsm[0];
        var stream = dsm[1];
        var message = dsm[2];
        return collectEndDataFromRun(routeDup, stream, function(){
          routeDup.returnMessage({
            id: message.id,
            method: METHODS.STREAM_END,
            data: null,
            error: false
          });
          return Promise.all(expectedMessages.map(function(data){
            return writeToStream(stream, data);
          }));
        }).then(function(results){
          var dupValues = results[0];
          var dupErrors = results[1];
          var strValues = results[2];
          var strErrors = results[3];
          var finishes = results[4];
          var ends = results[5];
          tr.equal(dupValues.length, 0, "duplex should have sent no messages");
          tr.equal(dupErrors.length, 0, "duplex should have no errors");
          tr.equal(strValues.length, 0, "stream should have pushed no values");
          tr.equal(strErrors.length, 0, "stream should have no errors");
          tr.equal(finishes, 1, "stream should have emitted finish once");
          tr.equal(ends, 1, "stream should have emitted end once");
          tr.end();
        });
      });
    });
    tv.end();
  });

  tt.test("ending", function(tv){
    tv.test("locally ending will emit end and finish events", function(tr){
      return initializeDuplexStreamAndMessage(tr).then(function(dsm){
        var dup = dsm[0];
        var stream = dsm[1];
        var message = dsm[2];
        return collectEndDataFromRun(dup, stream, function(){
          stream.end();
        }).then(function(results){
          var dupValues = results[0];
          var dupErrors = results[1];
          var strValues = results[2];
          var strErrors = results[3];
          var finishes = results[4];
          var ends = results[5];
          tr.equal(dupValues.length, 1, "duplex should have sent out a message");
          tr.equal(
            dupValues[0].method, METHODS.STREAM_END,
            "message should have a stream end method"
          );
          tr.equal(dupValues[0].id, message.id, "message id should be the same as the original");
          tr.equal(dupErrors.length, 0, "duplex should have no errors");
          tr.equal(strValues.length, 0, "stream should have pushed no values");
          tr.equal(strErrors.length, 0, "stream should have no errors");
          tr.equal(finishes, 1, "stream should have emitted finish once");
          tr.equal(ends, 1, "stream should have emitted end once");
          tr.end();
        });
      });
    });
    tv.test("locally aborting will emit end and finish events", function(tr){
      return initializeDuplexStreamAndMessage(tr).then(function(dsm){
        var dup = dsm[0];
        var stream = dsm[1];
        var message = dsm[2];
        return collectEndDataFromRun(dup, stream, function(){
          stream.abort();
        }).then(function(results){
          var dupValues = results[0];
          var dupErrors = results[1];
          var strValues = results[2];
          var strErrors = results[3];
          var finishes = results[4];
          var ends = results[5];
          tr.equal(dupValues.length, 1, "duplex should have sent out a message");
          tr.equal(dupValues[0].method, METHODS.ABORT, "message should have a stream abort method");
          tr.equal(dupValues[0].id, message.id, "message id should be the same as the original");
          tr.equal(dupErrors.length, 0, "duplex should have no errors");
          tr.equal(strValues.length, 0, "stream should have pushed no values");
          tr.equal(strErrors.length, 0, "stream should have no errors");
          tr.equal(finishes, 1, "stream should have emitted finish once");
          tr.equal(ends, 1, "stream should have emitted end once");
          tr.end();
        });
      });
    });
    tv.test("remotely ending will emit end and finish events", function(tr){
      return initializeDuplexStreamAndMessage(tr).then(function(dsm){
        var dup = dsm[0];
        var stream = dsm[1];
        var message = dsm[2];
        return collectEndDataFromRun(dup, stream, function(){
          dup.returnMessage({
            id: message.id,
            method: METHODS.STREAM_END,
            data: null,
            error: false
          });
        });
      }).then(function(results){
        var dupValues = results[0];
        var dupErrors = results[1];
        var strValues = results[2];
        var strErrors = results[3];
        var finishes = results[4];
        var ends = results[5];
        tr.equal(dupValues.length, 0, "duplex should not have sent out a message");
        tr.equal(dupErrors.length, 0, "duplex should have no errors");
        tr.equal(strValues.length, 0, "stream should have pushed no values");
        tr.equal(strErrors.length, 0, "stream should have no errors");
        tr.equal(finishes, 1, "stream should have emitted finish once");
        tr.equal(ends, 1, "stream should have emitted end once");
        tr.end();
      });
    });
    tv.test("after ending will not reemmit", function(tvv){
      var standardCheck = function(results, tr){
        var dupValues = results[0];
        var dupErrors = results[1];
        var strValues = results[2];
        var strErrors = results[3];
        var finishes = results[4];
        var ends = results[5];
        tr.equal(dupValues.length, 0, "duplex should not have sent out a message");
        tr.equal(dupErrors.length, 0, "duplex should have no errors");
        tr.equal(strValues.length, 0, "stream should have pushed no values");
        tr.equal(strErrors.length, 0, "stream should have no errors");
        tr.equal(finishes, 1, "stream should have emitted finish once");
        tr.equal(ends, 1, "stream should have emitted end once");
      };
      var emptyCheck = function(results, tr){
        var dupValues = results[0];
        var dupErrors = results[1];
        var strValues = results[2];
        var strErrors = results[3];
        var finishes = results[4];
        var ends = results[5];
        tr.equal(dupValues.length, 0, "duplex should not have sent out a message");
        tr.equal(dupErrors.length, 0, "duplex should have no errors");
        tr.equal(strValues.length, 0, "stream should have pushed no values");
        tr.equal(strErrors.length, 0, "stream should have no errors");
        tr.equal(finishes, 0, "stream should have emitted finish once");
        tr.equal(ends, 0, "stream should have emitted end once");
      };
      [{
        name: "end",
        fn: function(dsm){
          dsm[1].end();
        }
      }, {
        name: "abort",
        fn: function(dsm){
          dsm[1].abort();
        }
      }, {
        name: "remote",
        fn: function(dsm){
          dsm[0].returnMessage({
            id: dsm[2].id,
            method: METHODS.STREAM_END,
            data: null,
            error: false
          });
        }
      }].forEach(function(toRun){
        tvv.test(toRun.name, function(tr){
          return initializeDuplexStreamAndMessage(tr).then(function(dsm){
            var dup = dsm[0];
            var stream = dsm[1];
            var message = dsm[2];
            return collectEndDataFromRun(dup, stream, function(){
              dup.returnMessage({
                id: message.id,
                method: METHODS.STREAM_END,
                data: null,
                error: false
              });
            }).then(function(results){
              standardCheck(results, tr);
              return collectEndDataFromRun(dup, stream, function(){
                toRun.fn(dsm);
              }).then(function(results){
                emptyCheck(results, tr);
                tr.end();
              });
            });
          });
        });
      });
      tvv.end();
    });

    tv.end();
  });
  tt.end();
});
tap.end && tap.end();

function initializeDuplexStreamAndMessage(tr){
  var routeDup = new Duplex();
  var expectedPath = "/meh";
  var expectedRec = {};
  var stream;
  return Promise.race([
    new Promise(function(res){
      routeDup.on("data", function(data){
        res(data);
      });
      stream = routeDup.stream(expectedPath, expectedRec);
    }),
    delay(200).then(function(){ throw "timed out"; })
  ]).then(function(message){
    tr.ok(message.id, "message has an id");
    tr.equal(message.path, expectedPath, "path is as expected");
    tr.equal(message.data, expectedRec, "data is as expected");
    tr.equal(message.method, METHODS.STREAM_START, "method is as expected");
    return [routeDup, stream, message];
  });
}

function collectStreamDataFromRun(stream, run){
  var values = [];
  var errors = [];
  var didEnd = false;
  stream.on("data", function(val){
    values.push(val);
  });
  stream.on("error", function(val){
    errors.push(val);
  });
  stream.on("finish", function(){
    didEnd = true;
  });
  return Promise.all([
    delay(200),
    Promise.resolve().then(run)
  ]).then(function(){ return [values, errors, didEnd]; });
}

function collectEndDataFromRun(dup, stream, run){
  var dupvalues = [];
  var duperrors = [];
  var values = [];
  var errors = [];
  var finishes = 0;
  var ends = 0;
  dup.on("data", function(val){
    dupvalues.push(val);
  });
  dup.on("error", function(val){
    duperrors.push(val);
  });
  stream.on("data", function(val){
    values.push(val);
  });
  stream.on("error", function(val){
    errors.push(val);
  });
  stream.on("finish", function(){
    finishes++;
  });
  stream.on("end", function(){
    ends++;
  });
  return Promise.all([
    delay(200),
    Promise.resolve().then(run)
  ]).then(function(){
    return [dupvalues, duperrors, values, errors, finishes, ends];
  });
}
