import { mock, MockProxy } from "jest-mock-extended";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { VerificationType } from "@bitwarden/common/auth/enums/verification-type";
import { Verification } from "@bitwarden/common/types/verification";

import { CredentialCreateOptionsView } from "../../views/credential-create-options.view";

import { CredentialCreateOptionsResponse } from "./response/credential-create-options.response";
import { WebauthnApiService } from "./webauthn-api.service";
import { WebauthnService } from "./webauthn.service";

describe("WebauthnService", () => {
  let apiService!: MockProxy<WebauthnApiService>;
  let platformUtilsService!: MockProxy<PlatformUtilsService>;
  let i18nService!: MockProxy<I18nService>;
  let credentials: MockProxy<CredentialsContainer>;
  let webauthnService!: WebauthnService;

  beforeAll(() => {
    apiService = mock<WebauthnApiService>();
    platformUtilsService = mock<PlatformUtilsService>();
    i18nService = mock<I18nService>();
    credentials = mock<CredentialsContainer>();
    webauthnService = new WebauthnService(
      apiService,
      platformUtilsService,
      i18nService,
      credentials
    );
  });

  describe("getNewCredentialOptions", () => {
    it("should return undefined and show toast when api service call throws", async () => {
      apiService.getCredentialCreateOptions.mockRejectedValue(new Error("Mock error"));
      const verification = createVerification();

      const result = await webauthnService.getCredentialCreateOptions(verification);

      expect(result).toBeUndefined();
      expect(platformUtilsService.showToast).toHaveBeenCalled();
    });

    it("should return options when api service call is successfull", async () => {
      const options = Symbol() as any;
      const token = Symbol() as any;
      const response = { options, token } as CredentialCreateOptionsResponse;
      apiService.getCredentialCreateOptions.mockResolvedValue(response);
      const verification = createVerification();

      const result = await webauthnService.getCredentialCreateOptions(verification);

      expect(result).toEqual({ options, token });
    });
  });

  describe("createCredential", () => {
    it("should return undefined when navigator.credentials throws", async () => {
      credentials.create.mockRejectedValue(new Error("Mocked error"));
      const options = createCredentialCreateOptions();

      const result = await webauthnService.createCredential(options);

      expect(result).toBeUndefined();
    });

    it("should return credential when navigator.credentials does not throw", async () => {
      const credential: Credential = Symbol() as any;
      credentials.create.mockResolvedValue(credential);
      const options = createCredentialCreateOptions();

      const result = await webauthnService.createCredential(options);

      expect(result).toBe(credential);
    });
  });
});

function createVerification(): Verification {
  return {
    type: VerificationType.MasterPassword,
    secret: "secret",
  };
}

function createCredentialCreateOptions(): CredentialCreateOptionsView {
  return new CredentialCreateOptionsView(Symbol() as any, Symbol() as any);
}
