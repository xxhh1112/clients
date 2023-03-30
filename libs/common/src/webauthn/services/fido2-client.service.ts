import { parse } from "tldts";

import { Fido2AuthenticatorService } from "../abstractions/fido2-authenticator.service.abstraction";
import {
  AssertCredentialParams,
  AssertCredentialResult,
  CreateCredentialParams,
  CreateCredentialResult,
  Fido2ClientService as Fido2ClientServiceAbstraction,
  PublicKeyCredentialParam,
} from "../abstractions/fido2-client.service.abstraction";
import { Fido2Utils } from "../abstractions/fido2-utils";

export class Fido2ClientService implements Fido2ClientServiceAbstraction {
  constructor(private authenticator: Fido2AuthenticatorService) {}

  createCredential(
    params: CreateCredentialParams,
    abortController?: AbortController
  ): Promise<CreateCredentialResult> {
    if (!params.sameOriginWithAncestors) {
      throw new DOMException("Invalid 'sameOriginWithAncestors' value", "NotAllowedError");
    }

    const userId = Fido2Utils.stringToBuffer(params.user.id);
    if (userId.length < 1 || userId.length > 64) {
      throw new TypeError("Invalid 'user.id' length");
    }

    const { domain: effectiveDomain } = parse(params.origin, { allowPrivateDomains: true });
    if (effectiveDomain == undefined) {
      throw new DOMException("'origin' is not a valid domain", "SecurityError");
    }

    const rpId = params.rp.id ?? effectiveDomain;
    if (effectiveDomain !== rpId) {
      throw new DOMException("'rp.id' does not match origin effective domain", "SecurityError");
    }

    let credTypesAndPubKeyAlgs: PublicKeyCredentialParam[];
    if (params.pubKeyCredParams?.length > 0) {
      credTypesAndPubKeyAlgs = params.pubKeyCredParams.filter(
        (kp) => kp.alg === -7 && kp.type === "public-key"
      );
    } else {
      credTypesAndPubKeyAlgs = [
        { alg: -7, type: "public-key" },
        { alg: -257, type: "public-key" },
      ];
    }

    if (credTypesAndPubKeyAlgs.length === 0) {
      throw new DOMException("No supported key algorithms were found", "NotSupportedError");
    }
  }

  assertCredential(
    params: AssertCredentialParams,
    abortController?: AbortController
  ): Promise<AssertCredentialResult> {
    throw new Error("Not implemented");
  }
}
