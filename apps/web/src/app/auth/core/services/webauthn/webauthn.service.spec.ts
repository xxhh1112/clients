import { mock, MockProxy } from "jest-mock-extended";

import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";

import { CredentialCreateOptionsView } from "../../views/credential-create-options.view";
import { PendingWebauthnCredentialView } from "../../views/pending-webauthn-credential.view";

import { WebauthnApiService } from "./webauthn-api.service";
import { WebauthnService } from "./webauthn.service";

describe("WebauthnService", () => {
  let apiService!: MockProxy<WebauthnApiService>;
  let cryptoService!: MockProxy<CryptoService>;
  let credentials: MockProxy<CredentialsContainer>;
  let webauthnService!: WebauthnService;

  beforeAll(() => {
    // Polyfill missing class
    window.PublicKeyCredential = class {} as any;
    window.AuthenticatorAttestationResponse = class {} as any;
    window.crypto = { subtle: mock<typeof crypto>() } as any;
    apiService = mock<WebauthnApiService>();
    cryptoService = mock<CryptoService>();
    credentials = mock<CredentialsContainer>();
    webauthnService = new WebauthnService(apiService, cryptoService, credentials);
  });

  describe("createCredential", () => {
    it("should return undefined when navigator.credentials throws", async () => {
      credentials.create.mockRejectedValue(new Error("Mocked error"));
      const options = createCredentialCreateOptions();

      const result = await webauthnService.createCredential(options);

      expect(result).toBeUndefined();
    });

    it("should return credential when navigator.credentials does not throw", async () => {
      const credential = createDeviceResponse({ prf: false });
      credentials.create.mockResolvedValue(credential as PublicKeyCredential);
      const options = createCredentialCreateOptions();

      const result = await webauthnService.createCredential(options);

      expect(result).toEqual({
        createOptions: options,
        deviceResponse: credential,
        supportsPrf: false,
      } as PendingWebauthnCredentialView);
    });

    it("should return prfSupport=true when extensions contain prf", async () => {
      const credential = createDeviceResponse({ prf: true });
      credentials.create.mockResolvedValue(credential as PublicKeyCredential);
      const options = createCredentialCreateOptions();

      const result = await webauthnService.createCredential(options);

      expect(result.supportsPrf).toBe(true);
    });
  });

  describe("createCrypoKeys", () => {
    it("should return undefined when navigator.credentials throws", async () => {
      credentials.get.mockRejectedValue(new Error("Mocked error"));
      const pendingCredential = createPendingWebauthnCredentialView();

      const result = await webauthnService.createCryptoKeys(pendingCredential);

      expect(result).toBeUndefined();
    });

    // TODO: Fill out with crypto tests
  });
});

function createCredentialCreateOptions(): CredentialCreateOptionsView {
  const challenge = {
    publicKey: {
      extensions: {},
    },
    rp: {
      id: "bitwarden.com",
    },
    authenticatorSelection: {
      userVerification: "preferred",
    },
  };
  return new CredentialCreateOptionsView(challenge as any, Symbol() as any);
}

function createDeviceResponse({ prf = false }: { prf?: boolean } = {}): PublicKeyCredential {
  const credential = {
    id: "dGVzdA==",
    rawId: new Uint8Array([0x74, 0x65, 0x73, 0x74]),
    type: "public-key",
    response: {
      attestationObject: new Uint8Array([0, 0, 0]),
      clientDataJSON: "eyJ0ZXN0IjoidGVzdCJ9",
    },
    getClientExtensionResults: () => {
      if (!prf) {
        return {};
      }

      return {
        prf: {
          enabled: true,
        },
      };
    },
  } as any;

  Object.setPrototypeOf(credential, PublicKeyCredential.prototype);
  Object.setPrototypeOf(credential.response, AuthenticatorAttestationResponse.prototype);

  return credential;
}

function createPendingWebauthnCredentialView() {
  return new PendingWebauthnCredentialView(
    createCredentialCreateOptions(),
    createDeviceResponse({ prf: true }),
    true
  );
}
