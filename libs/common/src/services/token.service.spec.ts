import { mock, MockProxy } from "jest-mock-extended";
import { Subject } from "rxjs";

import { awaitConcatMap } from "../../spec/utils";
import { StateService } from "../abstractions/state.service";
import {
  VaultTimeoutSettings,
  VaultTimeoutSettingsService,
} from "../abstractions/vaultTimeout/vaultTimeoutSettings.service";

import { TokenService } from "./token.service";

describe("TokenService", () => {
  describe("observes vaultTimeoutSettings", () => {
    let vaultTimeoutOptions: Subject<VaultTimeoutSettings>;
    let sut: TokenService;
    let stateService: MockProxy<StateService>;
    const token = "token";
    const refreshToken = "refreshToken";
    const clientId = "clientId";
    const clientSecret = "clientSecret";

    beforeEach(() => {
      vaultTimeoutOptions = new Subject<VaultTimeoutSettings>();
      const vaultTimeoutSettingsService = mock<VaultTimeoutSettingsService>();
      vaultTimeoutSettingsService.vaultTimeoutOptions$ = vaultTimeoutOptions.asObservable();

      stateService = mock<StateService>();

      stateService.getAccessToken.mockResolvedValue(token);
      stateService.getRefreshToken.mockResolvedValue(refreshToken);
      stateService.getApiKeyClientId.mockResolvedValue(clientId);
      stateService.getApiKeyClientSecret.mockResolvedValue(clientSecret);

      sut = new TokenService(stateService, vaultTimeoutSettingsService);
    });

    afterEach(() => {
      jest.resetAllMocks();

      // vaultTimeoutOptions.complete();
    });

    it("should clear the token when changed from lock to logout", async () => {
      const clearSpy = jest.spyOn(sut, "clearToken").mockResolvedValue();
      const tokenSpy = jest.spyOn(sut, "setToken").mockResolvedValue();
      const refreshTokenSpy = jest.spyOn(sut, "setRefreshToken").mockResolvedValue();
      const clientIdSpy = jest.spyOn(sut, "setClientId").mockResolvedValue();
      const clientSecretSpy = jest.spyOn(sut, "setClientSecret").mockResolvedValue();

      vaultTimeoutOptions.next({ timeout: 0, action: "logOut" });
      vaultTimeoutOptions.next({ timeout: 0, action: "lock" });
      vaultTimeoutOptions.next({ timeout: 0, action: "logOut" });

      await new Promise((resolve) => setTimeout(resolve, 50)); // needed due to async concatmap

      // twice per initial + second logout
      expect(clearSpy).toHaveBeenCalledTimes(2);
      expect(tokenSpy).toHaveBeenCalledTimes(2);
      expect(refreshTokenSpy).toHaveBeenCalledTimes(2);
      expect(clientIdSpy).toHaveBeenCalledTimes(2);
      expect(clientSecretSpy).toHaveBeenCalledTimes(2);
    });

    it("should not clear and set the token when changed from lock to lock", async () => {
      const spy = jest.spyOn(sut, "clearToken").mockResolvedValue();

      vaultTimeoutOptions.next({ timeout: 0, action: "lock" });
      vaultTimeoutOptions.next({ timeout: 0, action: "lock" });

      await awaitConcatMap(); // needed due to async concatmap

      expect(spy).not.toHaveBeenCalled(); // once per initial + second logout
    });
  });
});
