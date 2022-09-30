import * as cbor from "cbor-js";
import randombytes from "randombytes";

import { b64toBA } from "./conv-utils/base64";
import { Converters } from "./u2f/converters";

interface Key {
  key: CryptoKeyPair;
  appID: string;
  userID: BufferSource;
}

export class U2FDevice {
  keys: Record<string, Key> = {};

  async register(options: CredentialCreationOptions, origin: string): Promise<PublicKeyCredential> {
    const encoder = new TextEncoder();
    const rawId = randombytes(16) as Uint8Array;
    const keyId = coerceToBase64Url(rawId);
    const clientData = encoder.encode(
      JSON.stringify({
        type: "webauthn.create",
        challenge: Converters.base64ToBase64URL(
          Converters.Uint8ArrayToBase64(options.publicKey.challenge)
        ),
        origin,
      })
    );
    const clientDataHash = crypto.subtle.digest({ name: "SHA-256" }, clientData);

    const keyPair = await crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      true,
      ["sign", "verify"]
    );

    /*
    CBOR Example (real example from using my own Yubikey)
    Use https://cbor.nemo157.com/ to interpret binary
    {
        "fmt": "fido-u2f",
        "attStmt": {
            "sig": h'3046022100e47667e2ff3acef65fda18494aa1413a857731bc6540623dc393d401485f72d8022100dfc647cda4579d76ce69ee89a60c1622a50354c2169ee56f0797a415dad4e936',
            "x5c": [
                h'308202d9308201c1a003020102020900df92d9c4e2ed660a300d06092a864886f70d01010b0500302e312c302a0603550403132359756269636f2055324620526f6f742043412053657269616c203435373230303633313020170d3134303830313030303030305a180f32303530303930343030303030305a306f310b300906035504061302534531123010060355040a0c0959756269636f20414231223020060355040b0c1941757468656e74696361746f72204174746573746174696f6e3128302606035504030c1f59756269636f205532462045452053657269616c20313135353130393539393059301306072a8648ce3d020106082a8648ce3d030107034200040a186c6e4d0a6a528a44909a7a2423687028d4c57eccb717ba1280b85c2fc1e4e061668c3c20aef33350d19645238a2c390bf5dffa34ff25502f470f3d40b888a38181307f3013060a2b0601040182c40a0d0104050403050403302206092b0601040182c40a020415312e332e362e312e342e312e34313438322e312e373013060b2b0601040182e51c0201010404030204303021060b2b0601040182e51c010104041204102fc0579f811347eab116bb5a8db9202a300c0603551d130101ff04023000300d06092a864886f70d01010b0500038201010082acaf1130a99bd14327d2f8f9b041a2a04a6685272422e57b14b0b8f83b6f1545664bbf55681eaf0158722abfced2e4ac633cec0959564524b0f2e517dd971098b9891517ecd0c553a2e4739f9de13dafd0d5d7b8ac4a37f4f2cc30ef25cb00652d19db69d7da57bd1a9c1d8ed87d46d80d2b3bdfd1d9ef9d2b6832d4ad5bcd74214ce6a6141d16b2e93acb2c88f60a3eb6d5f61471975909373bc677902324571a573f60f07bbed17b92c8b59fa28210bfa8c6012293001b39efe57bf9cb1e3aca8a4130f83af8668f73def2711b20dc99e8a804eea3f7427197b6b451b3735c23bc9b1be274c26d3bf9196f8c4a4b715f4b95c4db7b97e7594eb465648c1c',
            ],
        },
        "authData": h'c46cef82ad1b546477591d008b08759ec3e6d2ecb4f39474bfea6969925d03b741000000000000000000000000000000000000000000402318fce9f90f6eac3769d75b1f353ca5992574573088ff59f3b6f3ad071a30cb90f92dfa300ae992b8009ca37deca8b819c1caa8ecabe1e1c1a849ac5ee03df5a50102032620012158206e4d531eb8b69f9e43323f468fd617b48bedd86a70623e507a15082dbc3925a2225820d32eb3515f1f92c45e16c2c365395ba3e4a368f0adad354a2c9488ad72deea20',
    }
    */

    // Much of this code is adapted from https://github.com/sbweeden/fido2-postman-clients/blob/92aec0f41eca76c0f92db8a6e87cf46aa3a2de1c/globals/fidoutils.js
    const authData = [];

    const rpIdHash = new Uint8Array(
      await crypto.subtle.digest({ name: "SHA-256" }, encoder.encode(options.publicKey.rp.id))
    );
    authData.push(...rpIdHash);

    /*
     * flags
     *  - conditionally set UV, UP and indicate attested credential data is present
     *  - Note we never set UV for fido-u2f
     */
    const up = false;
    const uv = false;
    // const attestationFormat = "fido-u2f";
    const attestationFormat = "packed" as string;
    const flags = (up ? 0x01 : 0x00) | (uv && attestationFormat != "fido-u2f" ? 0x04 : 0x00) | 0x40;
    authData.push(flags);

    // add 4 bytes of counter - we use time in epoch seconds as monotonic counter
    const now = new Date().getTime() / 1000;
    authData.push(
      ((now & 0xff000000) >> 24) & 0xff,
      ((now & 0x00ff0000) >> 16) & 0xff,
      ((now & 0x0000ff00) >> 8) & 0xff,
      now & 0x000000ff
    );

    // attestedCredentialData
    const attestedCredentialData = [];

    // Use 0 because we're self-signing at the moment
    const aaguid = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    attestedCredentialData.push(...aaguid);

    const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    // COSE format of the EC256 key
    const credPublicKeyCOSE = {
      "1": 2, // kty
      "3": -7, // alg
      "-1": 1, // crv
      "-2": b64toBA(publicKeyJwk.x),
      "-3": b64toBA(publicKeyJwk.y),
    };

    // credentialIdLength (2 bytes) and credential Id
    const lenArray = [(rawId.length - (rawId.length & 0xff)) / 256, rawId.length & 0xff];
    attestedCredentialData.push(...lenArray);
    attestedCredentialData.push(...rawId);

    // credential public key - take bytes from CBOR encoded COSE key
    const credPublicKeyBytes = bytesFromArray(
      new Uint8Array(cbor.encode(credPublicKeyCOSE)),
      0,
      -1
    );
    attestedCredentialData.push(...credPublicKeyBytes);

    authData.push(...attestedCredentialData);

    const sigBase = authData.concat(clientDataHash);
    const signature = await window.crypto.subtle.sign(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      keyPair.privateKey,
      new Uint8Array(sigBase)
    );

    const attestationObject = new Uint8Array(
      cbor.encode({
        fmt: attestationFormat,
        attStmt: {
          alg: -7,
          sig: new Uint8Array(signature), // FIX: This doesn't seem to be getting formatted correctly
        },
        authData: new Uint8Array(authData),
      })
    );

    // this.keys[keyId] = {
    //   key: keyPair,
    //   appID: rpId,
    //   userID: userId,
    // };

    return {
      id: keyId,
      rawId: rawId,
      type: "public-key",
      response: {
        clientDataJSON: clientData,
        attestationObject: attestationObject,
      } as AuthenticatorAttestationResponse,
      getClientExtensionResults: () => ({}),
    };
  }
}

// Taken from common-webauthn.ts
function coerceToBase64Url(thing: any) {
  // Array or ArrayBuffer to Uint8Array
  if (Array.isArray(thing)) {
    thing = Uint8Array.from(thing);
  }

  if (thing instanceof ArrayBuffer) {
    thing = new Uint8Array(thing);
  }

  // Uint8Array to base64
  if (thing instanceof Uint8Array) {
    let str = "";
    const len = thing.byteLength;

    for (let i = 0; i < len; i++) {
      str += String.fromCharCode(thing[i]);
    }
    thing = window.btoa(str);
  }

  if (typeof thing !== "string") {
    throw new Error("could not coerce to string");
  }

  // base64 to base64url
  // NOTE: "=" at the end of challenge is optional, strip it off here
  thing = thing.replace(/\+/g, "-").replace(/\//g, "_").replace(/=*$/g, "");

  return thing;
}

/**
 * Extracts the bytes from an array beginning at index start, and continuing until
 * index end-1 or the end of the array is reached. Pass -1 for end if you want to
 * parse till the end of the array.
 */
function bytesFromArray(o: string | any[] | Uint8Array, start: number, end: number) {
  // o may be a normal array of bytes, or it could be a JSON encoded Uint8Array
  let len = o.length;
  if (len == null) {
    len = Object.keys(o).length;
  }

  const result = [];
  for (let i = start; (end == -1 || i < end) && i < len; i++) {
    result.push(o[i]);
  }
  return result;
}
