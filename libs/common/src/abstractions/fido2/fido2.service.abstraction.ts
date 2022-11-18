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
}

export abstract class Fido2Service {
  createCredential: (params: CredentialRegistrationParams) => unknown;
  assertCredential: () => unknown;
}
