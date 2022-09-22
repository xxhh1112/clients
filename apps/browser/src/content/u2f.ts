// var elliptic = require("elliptic");
// var EC = elliptic.ec;
// var ecdsa = new EC("p256");

// import createHash from "create-hash";
// import { ec } from "elliptic";
import randombytes from "randombytes";

import { Converters } from "./u2f/converters";

const ReservedByte = 0x05;

interface Key {
  key: CryptoKeyPair;
  appID: string;
  userID: BufferSource;
}

export class U2FDevice {
  keys: Record<string, Key> = {};

  async register(
    appId: string,
    challenge: BufferSource,
    baseURL: string,
    userId: BufferSource
  ): Promise<PublicKeyCredential> {
    const keyHandle = randombytes(16);
    const keyId = Converters.base64ToBase64URL(Converters.Uint8ArrayToBase64(keyHandle));
    const clientData =
      '{"type":"navigator.id.finishEnrollment","challenge":"' +
      challenge +
      '","origin":"' +
      baseURL +
      '"}';

    const keyPair = await crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      true,
      ["sign", "verify"]
    );

    // const encoded = encoder.encode(challenge);
    const signature = new Uint8Array(
      await window.crypto.subtle.sign(
        {
          name: "ECDSA",
          hash: { name: "SHA-384" },
        },
        keyPair.privateKey,
        challenge
      )
    );

    const publicKey = new Uint8Array(await crypto.subtle.exportKey("raw", keyPair.publicKey));
    const keyHandleLength = keyHandle.length;
    const certificate = U2FDevice.getCertificate(publicKey);

    const registrationData = new Uint8Array(
      1 + publicKey.length + 1 + keyHandleLength + certificate.length + signature.length
    );
    registrationData.set([ReservedByte], 0);
    registrationData.set(publicKey, 1);
    registrationData.set([keyHandleLength], 1 + 65);
    registrationData.set(keyHandle, 1 + 65 + 1);
    registrationData.set(certificate, 1 + 65 + 1 + keyHandleLength);
    registrationData.set(signature, 1 + 65 + 1 + keyHandleLength + 200);

    this.keys[keyId] = {
      key: keyPair,
      appID: appId,
      userID: userId,
    };

    const encoder = new TextEncoder();
    return {
      id: keyId,
      rawId: keyHandle,
      type: "public-key",
      response: {
        clientDataJSON: encoder.encode(clientData),
        attestationObject: registrationData,
      } as any,
      getClientExtensionResults: () => ({}),
    };
    // return {
    //   keyID: keyId,
    //   response: {
    //     clientData: Converters.Uint8ArrayToBase64(encoder.encode(clientData)),
    //     registrationData: Converters.base64ToBase64URL(
    //       Converters.Uint8ArrayToBase64(registrationData)
    //     ),
    //   },
    // };
  }

  async register2(appID: any, challenge: any, baseURL: any, userID: any) {
    // const keyPair = ecdsa.genKeyPair();
    // const keyHandle = randombytes(16);
    // const keyID = Converters.base64ToBase64URL(Converters.Uint8ArrayToBase64(keyHandle));
    // const clientData =
    //   '{"type":"navigator.id.finishEnrollment","challenge":"' +
    //   challenge +
    //   '","origin":"' +
    //   baseURL +
    //   '"}';
    // const reservedByte = 0x05;
    // const publicKey = (keyPair.getPublic as any)("raw");
    // const keyHandleLength = keyHandle.length;
    // let certificate;
    // let certBytes = [
    //   0x30, 0x81, 0xc5, 0x30, 0x81, 0xb1, 0xa0, 0x03, 0x02, 0x01, 0x02, 0x02, 0x01, 0x01, 0x30,
    //   0x0a, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x04, 0x03, 0x02, 0x30, 0x0f, 0x31, 0x0d,
    //   0x30, 0x0b, 0x06, 0x03, 0x55, 0x04, 0x03, 0x13, 0x04, 0x66, 0x61, 0x6b, 0x65, 0x30, 0x1e,
    //   0x17, 0x0d, 0x37, 0x30, 0x30, 0x31, 0x30, 0x31, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x5a,
    //   0x17, 0x0d, 0x34, 0x38, 0x30, 0x31, 0x30, 0x31, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x5a,
    //   0x30, 0x0f, 0x31, 0x0d, 0x30, 0x0b, 0x06, 0x03, 0x55, 0x04, 0x03, 0x13, 0x04, 0x66, 0x61,
    //   0x6b, 0x65, 0x30, 0x59, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,
    //   0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, 0x03, 0x42, 0x00,
    // ];
    // certBytes = certBytes.concat([].slice.call(publicKey));
    // certBytes = certBytes.concat([
    //   0x30, 0x0a, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x04, 0x03, 0x02, 0x03, 0x03, 0x00,
    //   0x30, 0x00,
    // ]);
    // certificate = new Uint8Array(certBytes);
    // const encoder = new TextEncoder();
    // const applicationParameter = await crypto.subtle.digest(
    //   { name: "SHA-256" },
    //   encoder.encode(keyID)
    // );
    // console.log("applicationParameter", applicationParameter);
    // const challengeParameter = crypto.subtle.digest(
    //   { name: "SHA-256" },
    //   encoder.encode(clientData)
    // );
    // const bytesToSign = new Uint8Array(1 + 32 + 32 + keyHandleLength + 65);
    // bytesToSign.set([0x00], 0);
    // bytesToSign.set(applicationParameter, 1);
    // bytesToSign.set(challengeParameter, 33);
    // bytesToSign.set(keyHandle, 65);
    // bytesToSign.set(publicKey, 65 + keyHandleLength);
    // const signedBytes = keyPair
    //   .sign(crypto.createHash("sha256").update(new Buffer(bytesToSign)).digest())
    //   .toDER();
    // const registrationData = new Uint8Array(
    //   1 + publicKey.length + 1 + keyHandleLength + certificate.length + signedBytes.length
    // );
    // registrationData.set([reservedByte], 0);
    // registrationData.set(publicKey, 1);
    // registrationData.set([keyHandleLength], 1 + 65);
    // registrationData.set(keyHandle, 1 + 65 + 1);
    // registrationData.set(certificate, 1 + 65 + 1 + keyHandleLength);
    // registrationData.set(signedBytes, 1 + 65 + 1 + keyHandleLength + 200);
    // _this.keys[keyID] = {
    //   key: keyPair,
    //   appID: appID,
    //   userID: userID,
    // };
    // // resolve({
    // return {
    //   keyID: keyID,
    //   response: {
    //     clientData: Converters_1.Converters.Uint8ArrayToBase64(encoder.encode(clientData)),
    //     registrationData: Converters_1.Converters.base64ToBase64URL(
    //       Converters_1.Converters.Uint8ArrayToBase64(registrationData)
    //     ),
    //   },
    // };
  }

  private static getCertificate(publicKey: ArrayBuffer) {
    let certBytes = [
      0x30, 0x81, 0xc5, 0x30, 0x81, 0xb1, 0xa0, 0x03, 0x02, 0x01, 0x02, 0x02, 0x01, 0x01, 0x30,
      0x0a, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x04, 0x03, 0x02, 0x30, 0x0f, 0x31, 0x0d,
      0x30, 0x0b, 0x06, 0x03, 0x55, 0x04, 0x03, 0x13, 0x04, 0x66, 0x61, 0x6b, 0x65, 0x30, 0x1e,
      0x17, 0x0d, 0x37, 0x30, 0x30, 0x31, 0x30, 0x31, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x5a,
      0x17, 0x0d, 0x34, 0x38, 0x30, 0x31, 0x30, 0x31, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x5a,
      0x30, 0x0f, 0x31, 0x0d, 0x30, 0x0b, 0x06, 0x03, 0x55, 0x04, 0x03, 0x13, 0x04, 0x66, 0x61,
      0x6b, 0x65, 0x30, 0x59, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,
      0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, 0x03, 0x42, 0x00,
    ];
    certBytes = certBytes.concat([].slice.call(publicKey));
    certBytes = certBytes.concat([
      0x30, 0x0a, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x04, 0x03, 0x02, 0x03, 0x03, 0x00,
      0x30, 0x00,
    ]);
    return new Uint8Array(certBytes);
  }
}
