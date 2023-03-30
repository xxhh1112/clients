import { Fido2AuthenticatorService } from "../abstractions/fido2-authenticator.service.abstraction";
import {
  AssertCredentialParams,
  AssertCredentialResult,
  CreateCredentialParams,
  CreateCredentialResult,
  Fido2ClientService as Fido2ClientServiceAbstraction,
} from "../abstractions/fido2-client.service.abstraction";

export class Fido2ClientService implements Fido2ClientServiceAbstraction {
  constructor(private authenticator: Fido2AuthenticatorService) {}

  createCredential(
    params: CreateCredentialParams,
    abortController?: AbortController
  ): Promise<CreateCredentialResult> {
    if (!params.sameOriginWithAncestors) {
      throw new DOMException(undefined, "NotAllowedError");
    }

    throw new Error("Not implemented");
  }

  assertCredential(
    params: AssertCredentialParams,
    abortController?: AbortController
  ): Promise<AssertCredentialResult> {
    throw new Error("Not implemented");
  }
}
