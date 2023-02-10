export interface CredentialRegistrationParams {
  origin: string;
  attestation?: "direct" | "enterprise" | "indirect" | "none";
  authenticatorSelection?: {
    // authenticatorAttachment?: AuthenticatorAttachment; // not used
    requireResidentKey?: boolean;
    residentKey?: "discouraged" | "preferred" | "required";
    userVerification?: "discouraged" | "preferred" | "required";
  };
  challenge: string; // b64 encoded
  excludeCredentials?: {
    id: string; // b64 encoded
    transports?: ("ble" | "internal" | "nfc" | "usb")[];
    // type: "public-key"; // not used
  }[];
  extensions?: {
    appid?: string;
    appidExclude?: string;
    credProps?: boolean;
    uvm?: boolean;
  };
  pubKeyCredParams: {
    alg: number;
    // type: "public-key"; // not used
  }[];
  rp: {
    id?: string;
    name: string;
  };
  user: {
    id: string; // b64 encoded
    displayName: string;
  };
  timeout: number;
}

export interface CredentialRegistrationResult {
  credentialId: string;
  clientDataJSON: string;
  attestationObject: string;
  authData: string;
  publicKeyAlgorithm: number;
  transports: string[];
}

export interface CredentialAssertParams {
  allowedCredentialIds: string[];
  rpId: string;
  origin: string;
  challenge: string;
  userVerification?: "discouraged" | "preferred" | "required";
  timeout: number;
}

export interface CredentialAssertResult {
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  userHandle: string;
}

export class Fido2Error extends Error {
  constructor(message: string, readonly fallbackRequested = false) {
    super(message);
  }
}

export class RequestAbortedError extends Fido2Error {
  constructor(fallbackRequested = false) {
    super("Fido2 request was aborted", fallbackRequested);
  }
}

export class NoCredentialFoundError extends Fido2Error {
  constructor() {
    super("No valid credential found", true);
  }
}

export class OriginMismatchError extends Fido2Error {
  constructor() {
    super(
      "Authentication requests must originate from the same source that created the credential.",
      false
    );
  }
}

export abstract class Fido2Service {
  createCredential: (
    params: CredentialRegistrationParams,
    abortController?: AbortController
  ) => Promise<CredentialRegistrationResult>;
  assertCredential: (
    params: CredentialAssertParams,
    abortController?: AbortController
  ) => Promise<CredentialAssertResult>;
}
