import { mock, MockProxy } from "jest-mock-extended";

import { CreateCredentialParams } from "../abstractions/fido2-client.service.abstraction";

import { Fido2AuthenticatorService } from "./fido2-authenticator.service";
import { Fido2ClientService } from "./fido2-client.service";

const RpId = "bitwarden.com";

describe("FidoAuthenticatorService", () => {
  let authenticator!: MockProxy<Fido2AuthenticatorService>;
  let client!: Fido2ClientService;

  beforeEach(async () => {
    authenticator = mock<Fido2AuthenticatorService>();
    client = new Fido2ClientService(authenticator);
  });

  describe("createCredential", () => {
    describe("invalid input parameters", () => {
      /** Spec: If sameOriginWithAncestors is false, return a "NotAllowedError" DOMException. */
      it("throw error if sameOriginWithAncestors is false", async () => {
        const params = createParams({ sameOriginWithAncestors: false });

        const result = async () => await client.createCredential(params);

        await expect(result).rejects.toThrowError(new DOMException(undefined, "NotAllowedError"));
      });
    });

    function createParams(params: Partial<CreateCredentialParams> = {}): CreateCredentialParams {
      return {
        origin: params.origin ?? "bitwarden.com",
        sameOriginWithAncestors: params.sameOriginWithAncestors ?? true,
        attestation: params.attestation,
        authenticatorSelection: params.authenticatorSelection,
        challenge: params.challenge ?? "MzItYnl0ZXMtYmFzZTY0LWVuY29kZS1jaGFsbGVuZ2U",
        excludeCredentials: params.excludeCredentials,
        extensions: params.extensions,
        pubKeyCredParams: params.pubKeyCredParams ?? [
          {
            alg: -7,
          },
        ],
        rp: params.rp ?? {
          id: RpId,
          name: "Bitwarden",
        },
        user: params.user ?? {
          id: "YmFzZTY0LWVuY29kZWQtdXNlci1pZA",
          displayName: "User Name",
        },
        timeout: params.timeout,
      };
    }
  });
});
