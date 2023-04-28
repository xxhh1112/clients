export const UserRequestedFallbackAbortReason = "UserRequestedFallback";

export type UserVerification = "discouraged" | "preferred" | "required";

export abstract class Fido2ClientService {
  createCredential: (
    params: CreateCredentialParams,
    abortController?: AbortController
  ) => Promise<CreateCredentialResult>;
  assertCredential: (
    params: AssertCredentialParams,
    abortController?: AbortController
  ) => Promise<AssertCredentialResult>;
}

export interface CreateCredentialParams {
  origin: string;
  sameOriginWithAncestors: boolean;
  attestation?: "direct" | "enterprise" | "indirect" | "none";
  authenticatorSelection?: {
    // authenticatorAttachment?: AuthenticatorAttachment; // not used
    requireResidentKey?: boolean;
    residentKey?: "discouraged" | "preferred" | "required";
    userVerification?: UserVerification;
  };
  challenge: string; // b64 encoded
  excludeCredentials?: {
    id: string; // b64 encoded
    transports?: ("ble" | "hybrid" | "internal" | "nfc" | "usb")[];
    type: "public-key";
  }[];
  extensions?: {
    appid?: string;
    appidExclude?: string;
    credProps?: boolean;
    uvm?: boolean;
  };
  pubKeyCredParams: PublicKeyCredentialParam[];
  rp: {
    id?: string;
    name: string;
  };
  user: {
    id: string; // b64 encoded
    displayName: string;
  };
  fallbackSupported: boolean;
  timeout?: number;
}

export interface CreateCredentialResult {
  credentialId: string;
  clientDataJSON: string;
  attestationObject: string;
  authData: string;
  publicKeyAlgorithm: number;
  transports: string[];
}

export interface AssertCredentialParams {
  allowedCredentialIds: string[];
  rpId: string;
  origin: string;
  challenge: string;
  userVerification?: UserVerification;
  timeout: number;
  sameOriginWithAncestors: boolean;
  fallbackSupported: boolean;
}

export interface AssertCredentialResult {
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  userHandle: string;
}

export interface PublicKeyCredentialParam {
  alg: number;
  type: "public-key";
}

export class FallbackRequestedError extends Error {
  readonly fallbackRequested = true;
  constructor() {
    super("FallbackRequested");
  }
}
