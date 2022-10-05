// utils: https://github.com/Brightspace/node-ecdsa-sig-formatter/blob/master/src/param-bytes-for-alg.js

import { subarray } from "./conv-utils/util";

function getParamSize(keySize: number) {
  const result = ((keySize / 8) | 0) + (keySize % 8 === 0 ? 0 : 1);
  return result;
}

const paramBytesForAlg = {
  ES256: getParamSize(256),
  ES384: getParamSize(384),
  ES512: getParamSize(521),
};

type Alg = keyof typeof paramBytesForAlg;

function getParamBytesForAlg(alg: Alg) {
  const paramBytes = paramBytesForAlg[alg];
  if (paramBytes) {
    return paramBytes;
  }

  throw new Error('Unknown algorithm "' + alg + '"');
}

// main: https://github.com/Brightspace/node-ecdsa-sig-formatter/blob/master/src/ecdsa-sig-formatter.js

const MAX_OCTET = 0x80,
  CLASS_UNIVERSAL = 0,
  PRIMITIVE_BIT = 0x20,
  TAG_SEQ = 0x10,
  TAG_INT = 0x02,
  ENCODED_TAG_SEQ = TAG_SEQ | PRIMITIVE_BIT | (CLASS_UNIVERSAL << 6),
  ENCODED_TAG_INT = TAG_INT | (CLASS_UNIVERSAL << 6);

function countPadding(buf: Uint8Array, start: number, stop: number) {
  let padding = 0;
  while (start + padding < stop && buf[start + padding] === 0) {
    ++padding;
  }

  const needsSign = buf[start + padding] >= MAX_OCTET;
  if (needsSign) {
    --padding;
  }

  return padding;
}

export function joseToDer(signature: Uint8Array, alg: Alg) {
  const paramBytes = getParamBytesForAlg(alg);

  const signatureBytes = signature.length;
  if (signatureBytes !== paramBytes * 2) {
    throw new TypeError(
      '"' +
        alg +
        '" signatures must be "' +
        paramBytes * 2 +
        '" bytes, saw "' +
        signatureBytes +
        '"'
    );
  }

  const rPadding = countPadding(signature, 0, paramBytes);
  const sPadding = countPadding(signature, paramBytes, signature.length);
  const rLength = paramBytes - rPadding;
  const sLength = paramBytes - sPadding;

  const rsBytes = 1 + 1 + rLength + 1 + 1 + sLength;

  const shortLength = rsBytes < MAX_OCTET;

  //const dst = Buffer.allocUnsafe((shortLength ? 2 : 3) + rsBytes);
  const dst = new Uint8Array((shortLength ? 2 : 3) + rsBytes);

  let offset = 0;
  dst[offset++] = ENCODED_TAG_SEQ;
  if (shortLength) {
    // Bit 8 has value "0"
    // bits 7-1 give the length.
    dst[offset++] = rsBytes;
  } else {
    // Bit 8 of first octet has value "1"
    // bits 7-1 give the number of additional length octets.
    dst[offset++] = MAX_OCTET | 1;
    // length, base 256
    dst[offset++] = rsBytes & 0xff;
  }
  dst[offset++] = ENCODED_TAG_INT;
  dst[offset++] = rLength;
  if (rPadding < 0) {
    dst[offset++] = 0;
    // buf1.copy(buf2, a, b, c);
    // This is equivalent to:
    // buf2.set(buf1.subarray(b, c), a);

    // offset += signature.copy(dst, offset, 0, paramBytes);
    dst.set(subarray(signature, 0, paramBytes), offset);
    offset += paramBytes;
  } else {
    // offset += signature.copy(dst, offset, rPadding, paramBytes);
    dst.set(subarray(signature, rPadding, paramBytes), offset);
    offset += paramBytes;
  }
  dst[offset++] = ENCODED_TAG_INT;
  dst[offset++] = sLength;
  if (sPadding < 0) {
    dst[offset++] = 0;
    // signature.copy(dst, offset, paramBytes);
    dst.set(subarray(signature, paramBytes), offset);
  } else {
    // signature.copy(dst, offset, paramBytes + sPadding);
    dst.set(subarray(signature, paramBytes + sPadding), offset);
  }

  return dst;
}
