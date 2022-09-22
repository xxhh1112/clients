"use strict";
// var atob;
// var btoa;
// atob = window.atob;
// btoa = window.btoa;

var Converters = (function () {
  function Converters() {}
  Converters.stringToUint8Array = function (data) {
    return Uint8Array.from(
      Array.prototype.map.call(data, function (x) {
        return x.charCodeAt(0);
      })
    );
  };
  Converters.Uint8ArrayToString = function (data) {
    return Array.prototype.map
      .call(data, function (x) {
        return String.fromCharCode(x);
      })
      .join("");
  };
  Converters.base64ToUint8Array = function (data) {
    var asStr = atob(data);
    return Converters.stringToUint8Array(asStr);
  };
  Converters.Uint8ArrayToBase64 = function (data) {
    return btoa(Converters.Uint8ArrayToString(data));
  };
  Converters.base64ToBase64URL = function (data) {
    return data.split("=")[0].replace(/\+/g, "-").replace(/\//g, "_");
  };
  Converters.base64URLToBase64 = function (data) {
    var d = data.replace(/\-/g, "+").replace(/\_/g, "/");
    switch (d.length % 4) {
      case 0:
        break;
      case 2:
        d = d + "==";
        break;
      case 3:
        d = d + "=";
        break;
    }
    return d;
  };
  Converters.jwkToString = function (key, pubOnly) {
    if (key.kty !== "EC" || key.crv !== "P-256" || !key.x || !key.y)
      throw new Error("Key type not supported");
    if (key.d && !pubOnly) return [key.x, key.y, key.d].join("|");
    else return [key.x, key.y].join("|");
  };
  Converters.stringToJwk = function (key) {
    var arr = key.split("|");
    if (arr.length < 2 || arr.length > 3) throw new Error("Wrong string key representation");
    var ret = {
      kty: "EC",
      crv: "P-256",
      x: arr[0],
      y: arr[1],
      key_ops: ["deriveKey"],
    };
    if (arr[2]) {
      ret.d = arr[2];
    }
    return ret;
  };
  Converters.hexToBytes = function (hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2) bytes.push(parseInt(hex.substr(c, 2), 16));
    return new Uint8Array(bytes);
  };
  Converters.bytesToHex = function (bytes) {
    for (var hex = [], i = 0; i < bytes.length; i++) {
      hex.push((bytes[i] >>> 4).toString(16));
      hex.push((bytes[i] & 0xf).toString(16));
    }
    return hex.join("");
  };
  Converters.Uint32ToUint8Array = function (val) {
    var arr = new ArrayBuffer(4);
    var view = new DataView(arr);
    view.setUint32(0, val, false);
    return new Uint8Array(arr);
  };
  return Converters;
})();
exports.Converters = Converters;
//# sourceMappingURL=converters.js.map
