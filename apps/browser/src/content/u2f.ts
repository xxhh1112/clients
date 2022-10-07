// import * as cbor from "cbor-js";
import { CBOR as cbor } from "cbor-redux";
import randombytes from "randombytes";

import { b64toBA } from "./conv-utils/base64";
import { subarray } from "./conv-utils/util";
import { joseToDer } from "./ecdsa-sig-formatter";
import { Converters } from "./u2f/converters";
import { CredentialId } from "./u2f/credential-id";

const STANDARD_ATTESTATION_FORMAT = "packed";

interface BitCredential {
  credentialId: CredentialId;
  keyPair: CryptoKeyPair;
  origin: string;
}

export class U2FDevice {
  credentials = new Map<string, BitCredential>();

  async register(options: CredentialCreationOptions, origin: string): Promise<PublicKeyCredential> {
    const attestationFormat = STANDARD_ATTESTATION_FORMAT;
    const encoder = new TextEncoder();
    const credentialId = new CredentialId(randombytes(16) as Uint8Array);
    const rawChallenge = new Uint8Array(options.publicKey.challenge as any); // TODO: fix type

    const clientData = encoder.encode(
      JSON.stringify({
        type: "webauthn.create",
        challenge: Converters.base64ToBase64URL(Converters.Uint8ArrayToBase64(rawChallenge)),
        origin,
      })
    );
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      true,
      ["sign", "verify"]
    );

    // const keyPair = await crypto.subtle.generateKey(
    //   {
    //     name: "ECDSA",
    //     namedCurve: "P-256",
    //   },
    //   true,
    //   ["sign", "verify"]
    // );

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

    const authData = await generateAuthData({
      rpId: options.publicKey.rp.id,
      credentialId,
      userPresence: true,
      userVerification: false,
      keyPair,
      attestationFormat: STANDARD_ATTESTATION_FORMAT,
    });

    // const r = p1336_signature.subarray(0, p1336_signature.length / 2); // constructor denied, don't know why
    // const s = p1336_signature.subarray(p1336_signature.length / 2);
    // const r = subarray(p1336_signature, 0, p1336_signature.length / 2);
    // const s = subarray(p1336_signature, p1336_signature.length / 2, -1);

    // const asn1Der_signature = new Uint8Array(2 + 2 + r.length + 2 + s.length);
    // // SEQUENCE (total length)
    // asn1Der_signature.set([0x30, asn1Der_signature.length - 2], 0);
    // // INTEGER (length of r)
    // asn1Der_signature.set([0x20, r.length], 2);
    // // binary data: r
    // asn1Der_signature.set(r, 2 + 2);
    // // INTEGER (length of s)
    // asn1Der_signature.set([0x20, s.length], 2 + 2 + r.length);
    // // binary data: s
    // asn1Der_signature.set(s, 2 + 2 + r.length + 2);

    const asn1Der_signature = await generateSignature({
      authData,
      clientData,
      keyPair,
    });

    const attestationObject = new Uint8Array(
      cbor.encode({
        fmt: attestationFormat,
        attStmt: {
          alg: -7,
          sig: asn1Der_signature,
        },
        authData,
      })
    );

    // this.keys[keyId] = {
    //   key: keyPair,
    //   appID: rpId,
    //   userID: userId,
    // };

    // const binaryResponse = new Uint8Array(
    //   cbor.encode({
    //     id: keyId,
    //     rawId: rawId,
    //     type: "public-key",
    //     response: {
    //       clientDataJSON: clientData,
    //       attestationObject: attestationObject,
    //     } as AuthenticatorAttestationResponse,
    //   })
    // );

    this.credentials.set(credentialId.encoded, { credentialId, keyPair, origin });

    return {
      id: credentialId.encoded,
      rawId: credentialId.raw,
      type: "public-key",
      response: {
        clientDataJSON: clientData,
        attestationObject: attestationObject,
      } as AuthenticatorAttestationResponse,
      getClientExtensionResults: () => ({}),
    };
  }

  async get(options: CredentialRequestOptions, origin: string): Promise<PublicKeyCredential> {
    const credential = this.getCredential(options.publicKey.allowCredentials);

    if (credential === undefined) {
      throw new Error("No valid credentials found");
    }

    if (credential.origin !== origin) {
      throw new Error("Not allowed: Origin mismatch");
    }

    const encoder = new TextEncoder();
    const rawChallenge = new Uint8Array(options.publicKey.challenge as any); // TODO: fix type
    const clientData = encoder.encode(
      JSON.stringify({
        type: "webauthn.get",
        challenge: Converters.base64ToBase64URL(Converters.Uint8ArrayToBase64(rawChallenge)),
        origin,
      })
    );

    const authData = await generateAuthData({
      credentialId: credential.credentialId,
      rpId: options.publicKey.rpId,
      userPresence: true,
      userVerification: false,
    });

    const signature = await generateSignature({
      authData,
      clientData,
      keyPair: credential.keyPair,
    });

    return {
      id: credential.credentialId.encoded,
      rawId: credential.credentialId.raw,
      type: "public-key",
      response: {
        authenticatorData: authData,
        clientDataJSON: clientData,
        signature,
        userHandle: null, // only needed for discoverable credentials
      } as AuthenticatorAssertionResponse,
      getClientExtensionResults: () => ({}),
    };
  }

  private getCredential(allowCredentials: PublicKeyCredentialDescriptor[]) {
    let credential: BitCredential | undefined;
    for (const allowedCredential of allowCredentials) {
      const id = new CredentialId(allowedCredential.id);
      if (this.credentials.has(id.encoded)) {
        credential = this.credentials.get(id.encoded);
        break;
      }
    }
    return credential;
  }
}

interface AuthDataParams {
  rpId: string;
  credentialId: CredentialId;
  userPresence: boolean;
  userVerification: boolean;
  keyPair?: CryptoKeyPair;
  attestationFormat?: "packed" | "fido-u2f";
}

async function generateAuthData(params: AuthDataParams) {
  const encoder = new TextEncoder();

  // Much of this code is adapted from https://github.com/sbweeden/fido2-postman-clients/blob/92aec0f41eca76c0f92db8a6e87cf46aa3a2de1c/globals/fidoutils.js
  const authData: Array<number> = [];

  const rpIdHash = new Uint8Array(
    await crypto.subtle.digest({ name: "SHA-256" }, encoder.encode(params.rpId))
  );
  authData.push(...rpIdHash);

  const flags = authDataFlags({
    extensionData: false,
    attestationData: params.keyPair !== undefined,
    userVerification: params.userVerification,
    userPresence: params.userPresence,
  });
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
  const attestedCredentialData: Array<number> = [];

  // Use 0 because we're self-signing at the moment
  const aaguid = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  attestedCredentialData.push(...aaguid);

  // credentialIdLength (2 bytes) and credential Id
  const rawId = params.credentialId.raw;
  const credentialIdLength = [(rawId.length - (rawId.length & 0xff)) / 256, rawId.length & 0xff];
  attestedCredentialData.push(...credentialIdLength);
  attestedCredentialData.push(...rawId);

  if (params.keyPair) {
    const publicKeyJwk = await crypto.subtle.exportKey("jwk", params.keyPair.publicKey);
    // COSE format of the EC256 key
    const keyX = new Uint8Array(b64toBA(Converters.base64URLToBase64(publicKeyJwk.x)));
    const keyY = new Uint8Array(b64toBA(Converters.base64URLToBase64(publicKeyJwk.y)));
    // const credPublicKeyCOSE = {
    //   "1": 2, // kty
    //   "3": -7, // alg
    //   "-1": 1, // crv
    //   "-2": keyX,
    //   "-3": keyY,
    // };
    // const coseBytes = new Uint8Array(cbor.encode(credPublicKeyCOSE));
    // I can't get `cbor-redux` to encode in CTAP2 canonical CBOR. So we do it manually:
    const coseBytes = new Uint8Array(77);
    coseBytes.set([0xa5, 0x01, 0x02, 0x03, 0x26, 0x20, 0x01, 0x21, 0x58, 0x20], 0);
    coseBytes.set(keyX, 10);
    coseBytes.set([0x22, 0x58, 0x20], 10 + 32);
    coseBytes.set(keyY, 10 + 32 + 3);

    // credential public key - convert to array from CBOR encoded COSE key
    const credPublicKeyBytes = subarray(coseBytes, 0, -1);
    attestedCredentialData.push(...credPublicKeyBytes);

    authData.push(...attestedCredentialData);
  }

  return new Uint8Array(authData);
}

interface SignatureParams {
  authData: Uint8Array;
  clientData: Uint8Array;
  keyPair: CryptoKeyPair;
}

async function generateSignature(params: SignatureParams) {
  const clientDataHash = await crypto.subtle.digest({ name: "SHA-256" }, params.clientData);
  const sigBase = new Uint8Array([...params.authData, ...new Uint8Array(clientDataHash)]);
  const p1336_signature = new Uint8Array(
    await window.crypto.subtle.sign(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      params.keyPair.privateKey,
      sigBase
    )
  );

  const asn1Der_signature = joseToDer(p1336_signature, "ES256");

  return asn1Der_signature;
}

interface Flags {
  extensionData: boolean;
  attestationData: boolean;
  userVerification: boolean;
  userPresence: boolean;
}

function authDataFlags(options: Flags): number {
  let flags = 0;

  if (options.extensionData) {
    flags |= 0b1000000;
  }

  if (options.attestationData) {
    flags |= 0b01000000;
  }

  if (options.userVerification) {
    flags |= 0b00000100;
  }

  if (options.userPresence) {
    flags |= 0b00000001;
  }

  return flags;
}
