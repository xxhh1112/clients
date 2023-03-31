import { mock, MockProxy } from "jest-mock-extended";

import { Utils } from "../../misc/utils";
import {
  Fido2AutenticatorError,
  Fido2AutenticatorErrorCode,
  Fido2AuthenticatorGetAssertionResult,
  Fido2AuthenticatorMakeCredentialResult,
} from "../abstractions/fido2-authenticator.service.abstraction";
import {
  AssertCredentialParams,
  CreateCredentialParams,
} from "../abstractions/fido2-client.service.abstraction";
import { Fido2Utils } from "../abstractions/fido2-utils";

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

      // Spec: If credTypesAndPubKeyAlgs is empty, return a DOMException whose name is "NotSupportedError", and terminate this algorithm.
      it("should throw error if no support key algorithms were found", async () => {
        const params = createParams({
          pubKeyCredParams: [
            { alg: -9001, type: "public-key" },
            { alg: -7, type: "not-supported" as any },
          ],
        });

        const result = async () => await client.createCredential(params);

        const rejects = expect(result).rejects;
        await rejects.toMatchObject({ name: "NotSupportedError" });
        await rejects.toBeInstanceOf(DOMException);
      });
    });

    describe("aborting", () => {
      // Spec: If the options.signal is present and its aborted flag is set to true, return a DOMException whose name is "AbortError" and terminate this algorithm.
      it("should throw error if aborting using abort controller", async () => {
        const params = createParams({});
        const abortController = new AbortController();
        abortController.abort();

        const result = async () => await client.createCredential(params, abortController);

        const rejects = expect(result).rejects;
        await rejects.toMatchObject({ name: "AbortError" });
        await rejects.toBeInstanceOf(DOMException);
      });
    });

    describe("creating a new credential", () => {
      it("should call authenticator.makeCredential", async () => {
        const params = createParams({
          authenticatorSelection: { residentKey: "required", userVerification: "required" },
        });
        authenticator.makeCredential.mockResolvedValue(createAuthenticatorMakeResult());

        await client.createCredential(params);

        expect(authenticator.makeCredential).toHaveBeenCalledWith(
          expect.objectContaining({
            requireResidentKey: true,
            requireUserVerification: true,
            rpEntity: expect.objectContaining({
              id: RpId,
            }),
            userEntity: expect.objectContaining({
              displayName: params.user.displayName,
            }),
          }),
          expect.anything()
        );
      });

      // Spec: If any authenticator returns an error status equivalent to "InvalidStateError", Return a DOMException whose name is "InvalidStateError" and terminate this algorithm.
      it("should throw error if authenticator throws InvalidState", async () => {
        const params = createParams();
        authenticator.makeCredential.mockRejectedValue(
          new Fido2AutenticatorError(Fido2AutenticatorErrorCode.InvalidState)
        );

        const result = async () => await client.createCredential(params);

        const rejects = expect(result).rejects;
        await rejects.toMatchObject({ name: "InvalidStateError" });
        await rejects.toBeInstanceOf(DOMException);
      });

      // This keeps sensetive information form leaking
      it("should throw NotAllowedError if authenticator throws unknown error", async () => {
        const params = createParams();
        authenticator.makeCredential.mockRejectedValue(new Error("unknown error"));

        const result = async () => await client.createCredential(params);

        const rejects = expect(result).rejects;
        await rejects.toMatchObject({ name: "NotAllowedError" });
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
            type: "public-key",
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

    function createAuthenticatorMakeResult(): Fido2AuthenticatorMakeCredentialResult {
      return {
        credentialId: Utils.guidToRawFormat(Utils.newGuid()),
        attestationObject: randomBytes(128),
        authData: randomBytes(64),
        publicKeyAlgorithm: -7,
      };
    }
  });

  describe("assertCredential", () => {
    describe("invalid params", () => {
      // Spec: If callerOrigin is an opaque origin, return a DOMException whose name is "NotAllowedError", and terminate this algorithm.
      // Not sure how to check this, or if it matters.
      it.todo("should throw error if origin is an opaque origin");

      // Spec: Let effectiveDomain be the callerOrigin’s effective domain. If effective domain is not a valid domain, then return a DOMException whose name is "SecurityError" and terminate this algorithm.
      it("should throw error if origin is not a valid domain name", async () => {
        const params = createParams({
          origin: "invalid-domain-name",
        });

        const result = async () => await client.assertCredential(params);

        const rejects = expect(result).rejects;
        await rejects.toMatchObject({ name: "SecurityError" });
        await rejects.toBeInstanceOf(DOMException);
      });

      // Spec: If options.rp.id is not a registrable domain suffix of and is not equal to effectiveDomain, return a DOMException whose name is "SecurityError", and terminate this algorithm.
      it("should throw error if rp.id does not match origin effective domain", async () => {
        const params = createParams({
          origin: "passwordless.dev",
          rpId: "bitwarden.com",
        });

        const result = async () => await client.assertCredential(params);

        const rejects = expect(result).rejects;
        await rejects.toMatchObject({ name: "SecurityError" });
        await rejects.toBeInstanceOf(DOMException);
      });
    });

    describe("aborting", () => {
      // Spec: If the options.signal is present and its aborted flag is set to true, return a DOMException whose name is "AbortError" and terminate this algorithm.
      it("should throw error if aborting using abort controller", async () => {
        const params = createParams({});
        const abortController = new AbortController();
        abortController.abort();

        const result = async () => await client.assertCredential(params, abortController);

        const rejects = expect(result).rejects;
        await rejects.toMatchObject({ name: "AbortError" });
        await rejects.toBeInstanceOf(DOMException);
      });
    });

    describe("assert credential", () => {
      // Spec: If any authenticator returns an error status equivalent to "InvalidStateError", Return a DOMException whose name is "InvalidStateError" and terminate this algorithm.
      it("should throw error if authenticator throws InvalidState", async () => {
        const params = createParams();
        authenticator.getAssertion.mockRejectedValue(
          new Fido2AutenticatorError(Fido2AutenticatorErrorCode.InvalidState)
        );

        const result = async () => await client.assertCredential(params);

        const rejects = expect(result).rejects;
        await rejects.toMatchObject({ name: "InvalidStateError" });
        await rejects.toBeInstanceOf(DOMException);
      });

      // This keeps sensetive information form leaking
      it("should throw NotAllowedError if authenticator throws unknown error", async () => {
        const params = createParams();
        authenticator.getAssertion.mockRejectedValue(new Error("unknown error"));

        const result = async () => await client.assertCredential(params);

        const rejects = expect(result).rejects;
        await rejects.toMatchObject({ name: "NotAllowedError" });
        await rejects.toBeInstanceOf(DOMException);
      });
    });

    describe("assert non-discoverable credential", () => {
      it("should call authenticator.makeCredential", async () => {
        const allowedCredentialIds = [Utils.newGuid(), Utils.newGuid(), "not-a-guid"];
        const params = createParams({
          userVerification: "required",
          allowedCredentialIds,
        });
        authenticator.getAssertion.mockResolvedValue(createAuthenticatorAssertResult());

        await client.assertCredential(params);

        expect(authenticator.getAssertion).toHaveBeenCalledWith(
          expect.objectContaining({
            requireUserVerification: true,
            rpId: RpId,
            allowCredentialDescriptorList: [
              expect.objectContaining({
                id: Utils.guidToRawFormat(allowedCredentialIds[0]),
              }),
              expect.objectContaining({
                id: Utils.guidToRawFormat(allowedCredentialIds[1]),
              }),
            ],
          }),
          expect.anything()
        );
      });
    });

    describe("assert discoverable credential", () => {
      it("should call authenticator.makeCredential", async () => {
        const params = createParams({
          userVerification: "required",
          allowedCredentialIds: [],
        });
        authenticator.getAssertion.mockResolvedValue(createAuthenticatorAssertResult());

        await client.assertCredential(params);

        expect(authenticator.getAssertion).toHaveBeenCalledWith(
          expect.objectContaining({
            requireUserVerification: true,
            rpId: RpId,
            allowCredentialDescriptorList: [],
          }),
          expect.anything()
        );
      });
    });

    function createParams(params: Partial<AssertCredentialParams> = {}): AssertCredentialParams {
      return {
        allowedCredentialIds: params.allowedCredentialIds ?? [],
        challenge: params.challenge ?? Fido2Utils.bufferToString(randomBytes(16)),
        origin: params.origin ?? RpId,
        rpId: params.rpId ?? RpId,
        timeout: params.timeout,
        userVerification: params.userVerification,
        sameOriginWithAncestors: true,
      };
    }

    function createAuthenticatorAssertResult(): Fido2AuthenticatorGetAssertionResult {
      return {
        selectedCredential: {
          id: Utils.newGuid(),
          userHandle: randomBytes(32),
        },
        authenticatorData: randomBytes(64),
        signature: randomBytes(64),
      };
    }
  });
});

/** This is a fake function that always returns the same byte sequence */
function randomBytes(length: number) {
  return new Uint8Array(Array.from({ length }, (_, k) => k % 255));
}
