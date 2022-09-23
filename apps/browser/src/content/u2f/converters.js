export class Converters {
  static stringToUint8Array(data) {
    return Uint8Array.from(
      Array.prototype.map.call(data, function (x) {
        return x.charCodeAt(0);
      })
    );
  }

  static Uint8ArrayToString(data) {
    return Array.prototype.map
      .call(data, function (x) {
        return String.fromCharCode(x);
      })
      .join("");
  }

  static base64ToUint8Array(data) {
    var asStr = atob(data);
    return Converters.stringToUint8Array(asStr);
  }

  static Uint8ArrayToBase64(data) {
    return btoa(Converters.Uint8ArrayToString(data));
  }

  static base64ToBase64URL(data) {
    return data.split("=")[0].replace(/\+/g, "-").replace(/\//g, "_");
  }

  static base64URLToBase64(data) {
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
  }

  static hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2) bytes.push(parseInt(hex.substr(c, 2), 16));
    return new Uint8Array(bytes);
  }

  static bytesToHex(bytes) {
    for (var hex = [], i = 0; i < bytes.length; i++) {
      hex.push((bytes[i] >>> 4).toString(16));
      hex.push((bytes[i] & 0xf).toString(16));
    }
    return hex.join("");
  }

  static Uint32ToUint8Array(val) {
    var arr = new ArrayBuffer(4);
    var view = new DataView(arr);
    view.setUint32(0, val, false);
    return new Uint8Array(arr);
  }
}
