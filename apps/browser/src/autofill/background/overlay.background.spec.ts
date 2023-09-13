import { mock } from "jest-mock-extended";

import { AuthService } from "@bitwarden/common/auth/services/auth.service";
import { EnvironmentService } from "@bitwarden/common/platform/services/environment.service";
import { I18nService } from "@bitwarden/common/platform/services/i18n.service";
import { SettingsService } from "@bitwarden/common/services/settings.service";
import { CipherService } from "@bitwarden/common/vault/services/cipher.service";

import { BrowserStateService } from "../../platform/services/browser-state.service";
import AutofillService from "../services/autofill.service";

import OverlayBackground from "./overlay.background";

describe("OverlayBackground", () => {
  let overlayBackground: OverlayBackground;
  const cipherService = mock<CipherService>();
  const autofillService = mock<AutofillService>();
  const authService = mock<AuthService>();
  const environmentService = mock<EnvironmentService>();
  const settingsService = mock<SettingsService>();
  const stateService = mock<BrowserStateService>();
  const i18nService = mock<I18nService>();

  beforeEach(() => {
    overlayBackground = new OverlayBackground(
      cipherService,
      autofillService,
      authService,
      environmentService,
      settingsService,
      stateService,
      i18nService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("removePageDetails", () => {
    it("will pass a placeholder", () => {
      overlayBackground.removePageDetails(1);

      expect(true).toBe(true);
    });
  });
});
