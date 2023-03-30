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
      it("should throw error if sameOriginWithAncestors is false", async () => {
        const params = createParams({ sameOriginWithAncestors: false });

        const result = async () => await client.createCredential(params);

        const rejects = await expect(result).rejects;
        rejects.toMatchObject({ name: "NotAllowedError" });
        rejects.toBeInstanceOf(DOMException);
      });

      /** Spec: If the length of options.user.id is not between 1 and 64 bytes (inclusive) then return a TypeError. */
      it("should throw error if user.id is too small", async () => {
        const params = createParams({ user: { id: "", displayName: "name" } });

        const result = async () => await client.createCredential(params);

        await expect(result).rejects.toBeInstanceOf(TypeError);
      });

      /** Spec: If the length of options.user.id is not between 1 and 64 bytes (inclusive) then return a TypeError. */
      it("should throw error if user.id is too large", async () => {
        const params = createParams({
          user: {
            id: "YWJzb2x1dGVseS13YXktd2F5LXRvby1sYXJnZS1iYXNlNjQtZW5jb2RlZC11c2VyLWlkLWJpbmFyeS1zZXF1ZW5jZQ",
            displayName: "name",
          },
        });

        const result = async () => await client.createCredential(params);

        await expect(result).rejects.toBeInstanceOf(TypeError);
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
