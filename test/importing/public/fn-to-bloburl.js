/* eslint-env browser */
function fnToBlobUrl(initFn, args){

  var fnStr = "(" + initFn.toString() + ").apply(self, " + JSON.stringify(args) + ")";
  var blob;
  try{
    blob = new Blob(
      [fnStr], { type: "application/javascript" }
    );
  } catch (e){ // Backwards-compatibility
    var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
    blob = new BlobBuilder();
    blob.append(fnStr);
    blob = blob.getBlob();
  }
  return URL.createObjectURL(fnStr);
}

window.fnToBlobUrl = fnToBlobUrl;
