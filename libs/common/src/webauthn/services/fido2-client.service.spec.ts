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
      // Spec: If sameOriginWithAncestors is false, return a "NotAllowedError" DOMException.
      it("should throw error if sameOriginWithAncestors is false", async () => {
        const params = createParams({ sameOriginWithAncestors: false });

        const result = async () => await client.createCredential(params);

        const rejects = expect(result).rejects;
        await rejects.toMatchObject({ name: "NotAllowedError" });
        await rejects.toBeInstanceOf(DOMException);
      });

      // Spec: If the length of options.user.id is not between 1 and 64 bytes (inclusive) then return a TypeError.
      it("should throw error if user.id is too small", async () => {
        const params = createParams({ user: { id: "", displayName: "name" } });

        const result = async () => await client.createCredential(params);

        await expect(result).rejects.toBeInstanceOf(TypeError);
      });

      // Spec: If the length of options.user.id is not between 1 and 64 bytes (inclusive) then return a TypeError.
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

      // Spec: If callerOrigin is an opaque origin, return a DOMException whose name is "NotAllowedError", and terminate this algorithm.
      // Not sure how to check this, or if it matters.
      it.todo("should throw error if origin is an opaque origin");

      // Spec: Let effectiveDomain be the callerOrigin’s effective domain. If effective domain is not a valid domain, then return a DOMException whose name is "SecurityError" and terminate this algorithm.
      it("should throw error if origin is not a valid domain name", async () => {
        const params = createParams({
          origin: "invalid-domain-name",
        });

        const result = async () => await client.createCredential(params);

        const rejects = expect(result).rejects;
        await rejects.toMatchObject({ name: "SecurityError" });
        await rejects.toBeInstanceOf(DOMException);
      });

      // Spec: If options.rp.id is not a registrable domain suffix of and is not equal to effectiveDomain, return a DOMException whose name is "SecurityError", and terminate this algorithm.
      it("should throw error if rp.id does not match origin effective domain", async () => {
        const params = createParams({
          origin: "passwordless.dev",
          rp: { id: "bitwarden.com", name: "Bitwarden" },
        });

        const result = async () => await client.createCredential(params);

        const rejects = expect(result).rejects;
        await rejects.toMatchObject({ name: "SecurityError" });
        await rejects.toBeInstanceOf(DOMException);
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
