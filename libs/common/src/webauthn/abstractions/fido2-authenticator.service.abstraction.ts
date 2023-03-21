export abstract class Fido2AuthenticatorService {
  makeCredential: (params: Fido2AuthenticatorMakeCredentialsParams) => void;
}

export enum Fido2AutenticatorErrorCode {
  CTAP2_ERR_CREDENTIAL_EXCLUDED,
}

export class Fido2AutenticatorError extends Error {
  constructor(readonly errorCode: Fido2AutenticatorErrorCode) {
    super(Fido2AutenticatorErrorCode[errorCode]);
  }
}

/**
 * Parameters for {@link Fido2AuthenticatorService.makeCredential}
 *
 * @note
 * This interface uses the parameter names defined in `fido-v2.0-ps-20190130`
 * but the parameter values use the corresponding data structures defined in
 * `WD-webauthn-3-20210427`. This is to avoid the unnecessary complexity of
 * converting data to CBOR and back.
 */
export interface Fido2AuthenticatorMakeCredentialsParams {
  clientDataHash: BufferSource;
  rp: {
    name: string;
    id?: string;
  };
  user: {
    id: BufferSource;
    name?: string;
    displayName?: string;
    icon?: string;
  };
  pubKeyCredParams: {
    alg: number;
    type: "public-key"; // not used
  }[];
  excludeList?: {
    id: BufferSource;
    transports?: ("ble" | "internal" | "nfc" | "usb")[];
    type: "public-key"; // not used
  }[];
  extensions?: {
    appid?: string;
    appidExclude?: string;
    credProps?: boolean;
    uvm?: boolean;
  };
  options?: {
    rk?: boolean;
    uv?: boolean;
  };
}
