import { mock, MockProxy } from "jest-mock-extended";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { VerificationType } from "@bitwarden/common/auth/enums/verification-type";
import { ChallengeResponse } from "@bitwarden/common/auth/models/response/two-factor-web-authn.response";
import { Verification } from "@bitwarden/common/types/verification";

import { WebauthnApiService } from "./webauthn-api.service";
import { WebauthnService } from "./webauthn.service";

describe("WebauthnService", () => {
  let apiService!: MockProxy<WebauthnApiService>;
  let platformUtilsService!: MockProxy<PlatformUtilsService>;
  let i18nService!: MockProxy<I18nService>;
  let webauthnService!: WebauthnService;

  beforeAll(() => {
    apiService = mock<WebauthnApiService>();
    platformUtilsService = mock<PlatformUtilsService>();
    i18nService = mock<I18nService>();
    webauthnService = new WebauthnService(apiService, platformUtilsService, i18nService);
  });

  describe("getNewCredentialOptions", () => {
    it("should return undefined and show toast when api service call throws", async () => {
      apiService.getChallenge.mockRejectedValue(new Error("Mock error"));
      const verification = createVerification();

      const result = await webauthnService.getNewCredentialOptions(verification);

      expect(result).toBeUndefined();
      expect(platformUtilsService.showToast).toHaveBeenCalled();
    });

    it("should return options when api service call is successfull", async () => {
      const challenge: ChallengeResponse = Symbol() as any;
      apiService.getChallenge.mockResolvedValue(challenge);
      const verification = createVerification();

      const result = await webauthnService.getNewCredentialOptions(verification);

      expect(result).toEqual({ challenge });
    });
  });
});

function createVerification(): Verification {
  return {
    type: VerificationType.MasterPassword,
    secret: "secret",
  };
}
