import { CBOR } from "cbor-redux";

import { Fido2UserInterfaceService } from "../../abstractions/fido2/fido2-user-interface.service.abstraction";
import { Fido2Utils } from "../../abstractions/fido2/fido2-utils";
import {
  CredentialAssertParams,
  CredentialAssertResult,
  CredentialRegistrationParams,
  CredentialRegistrationResult,
  Fido2Service as Fido2ServiceAbstraction,
} from "../../abstractions/fido2/fido2.service.abstraction";
import { Utils } from "../../misc/utils";

import { CredentialId } from "./credential-id";
import { joseToDer } from "./ecdsa-utils";

const STANDARD_ATTESTATION_FORMAT = "packed";

interface BitCredential {
  credentialId: CredentialId;
  keyPair: CryptoKeyPair;
  rpId: string;
  origin: string;
  userHandle: Uint8Array;
}

export class Fido2Service implements Fido2ServiceAbstraction {
  private credentials = new Map<string, BitCredential>();

  constructor(private fido2UserInterfaceService: Fido2UserInterfaceService) {}

  async createCredential(
    params: CredentialRegistrationParams
  ): Promise<CredentialRegistrationResult> {
    await this.fido2UserInterfaceService.confirmNewCredential();
    // eslint-disable-next-line no-console
    console.log("Fido2Service.createCredential", params);

    const attestationFormat = STANDARD_ATTESTATION_FORMAT;
    const encoder = new TextEncoder();
    const credentialId = new CredentialId(Utils.newGuid());

    const clientData = encoder.encode(
      JSON.stringify({
        type: "webauthn.create",
        challenge: params.challenge,
        origin: params.origin,
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

    const authData = await generateAuthData({
      rpId: params.rp.id,
      credentialId,
      userPresence: true,
      userVerification: false,
      keyPair,
      attestationFormat: STANDARD_ATTESTATION_FORMAT,
    });

    const asn1Der_signature = await generateSignature({
      authData,
      clientData,
      keyPair,
    });

    const attestationObject = new Uint8Array(
      CBOR.encode({
        fmt: attestationFormat,
        attStmt: {
          alg: -7,
          sig: asn1Der_signature,
        },
        authData,
      })
    );

    this.credentials.set(credentialId.encoded, {
      credentialId,
      keyPair,
      origin: params.origin,
      rpId: params.rp.id,
      userHandle: Fido2Utils.stringToBuffer(params.user.id),
    });

    // eslint-disable-next-line no-console
    console.log("Fido2Service.createCredential => result", {
      credentialId: Fido2Utils.bufferToString(credentialId.raw),
      clientDataJSON: Fido2Utils.bufferToString(clientData),
      attestationObject: Fido2Utils.bufferToString(attestationObject),
    });

    return {
      credentialId: Fido2Utils.bufferToString(credentialId.raw),
      clientDataJSON: Fido2Utils.bufferToString(clientData),
      attestationObject: Fido2Utils.bufferToString(attestationObject),
    };
  }

  async assertCredential(params: CredentialAssertParams): Promise<CredentialAssertResult> {
    let credential: BitCredential | undefined;

    if (params.allowedCredentialIds && params.allowedCredentialIds.length > 0) {
      // We're looking for regular non-resident keys
      credential = this.getCredential(params.allowedCredentialIds);
    } else {
      // We're looking for a resident key
      credential = this.getCredentialByRp(params.rpId);
    }

    if (credential === undefined) {
      throw new Error("No valid credentials found");
    }

    if (credential.origin !== params.origin) {
      throw new Error("Not allowed: Origin mismatch");
    }

    const encoder = new TextEncoder();
    const clientData = encoder.encode(
      JSON.stringify({
        type: "webauthn.get",
        challenge: params.challenge,
        origin: params.origin,
      })
    );

    const authData = await generateAuthData({
      credentialId: credential.credentialId,
      rpId: params.rpId,
      userPresence: true,
      userVerification: true,
    });

    const signature = await generateSignature({
      authData,
      clientData,
      keyPair: credential.keyPair,
    });

    return {
      credentialId: credential.credentialId.encoded,
      clientDataJSON: Fido2Utils.bufferToString(clientData),
      authenticatorData: Fido2Utils.bufferToString(authData),
      signature: Fido2Utils.bufferToString(signature),
      userHandle: Fido2Utils.bufferToString(credential.userHandle),
    };
  }

  private getCredential(allowedCredentialIds: string[]): BitCredential | undefined {
    let credential: BitCredential | undefined;
    for (const allowedCredential of allowedCredentialIds) {
      const id = new CredentialId(allowedCredential);
      if (this.credentials.has(id.encoded)) {
        credential = this.credentials.get(id.encoded);
        break;
      }
    }
    return credential;
  }

  private getCredentialByRp(rpId: string): BitCredential | undefined {
    for (const credential of this.credentials.values()) {
      if (credential.rpId === rpId) {
        return credential;
      }
    }
    return undefined;
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
    const keyX = Utils.fromUrlB64ToArray(publicKeyJwk.x);
    const keyY = Utils.fromUrlB64ToArray(publicKeyJwk.y);

    // const credPublicKeyCOSE = {
    //   "1": 2, // kty
    //   "3": -7, // alg
    //   "-1": 1, // crv
    //   "-2": keyX,
    //   "-3": keyY,
    // };
    // const coseBytes = new Uint8Array(cbor.encode(credPublicKeyCOSE));

    // Can't get `cbor-redux` to encode in CTAP2 canonical CBOR. So we do it manually:
    const coseBytes = new Uint8Array(77);
    coseBytes.set([0xa5, 0x01, 0x02, 0x03, 0x26, 0x20, 0x01, 0x21, 0x58, 0x20], 0);
    coseBytes.set(keyX, 10);
    coseBytes.set([0x22, 0x58, 0x20], 10 + 32);
    coseBytes.set(keyY, 10 + 32 + 3);

    // credential public key - convert to array from CBOR encoded COSE key
    attestedCredentialData.push(...coseBytes);

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
