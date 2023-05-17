import { mock, mockReset } from "jest-mock-extended";

import { LogService } from "@bitwarden/common/abstractions/log.service";
import { EventType } from "@bitwarden/common/enums";
import { EventCollectionService } from "@bitwarden/common/services/event/event-collection.service";
import { SettingsService } from "@bitwarden/common/services/settings.service";
import { TotpService } from "@bitwarden/common/services/totp.service";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";
import { CardView } from "@bitwarden/common/vault/models/view/card.view";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { FieldView } from "@bitwarden/common/vault/models/view/field.view";
import { IdentityView } from "@bitwarden/common/vault/models/view/identity.view";
import { CipherService } from "@bitwarden/common/vault/services/cipher.service";

import {
  triggerTestFailure,
  createInputFieldDataItemMock,
  createAutofillPageDetailsMock,
  createChromeTabMock,
  createGenerateFillScriptOptionsMock,
} from "../../../utils/testing-utils";
import { BrowserStateService } from "../../services/browser-state.service";
import AutofillPageDetails from "../models/autofill-page-details";

import { AutoFillOptions } from "./abstractions/autofill.service";
import AutofillService from "./autofill.service";

describe("AutofillService", function () {
  let autofillService: AutofillService;

  const cipherService = mock<CipherService>();
  const stateService = mock<BrowserStateService>();
  const totpService = mock<TotpService>();
  const eventCollectionService = mock<EventCollectionService>();
  const logService = mock<LogService>();
  const settingsService = mock<SettingsService>();

  beforeEach(function () {
    jest.clearAllMocks();
    mockReset(cipherService);

    autofillService = new AutofillService(
      cipherService,
      stateService,
      totpService,
      eventCollectionService,
      logService,
      settingsService
    );
    chrome.tabs = {
      sendMessage: jest.fn(),
    } as any;
  });

  describe("getFormsWithPasswordFields", function () {
    let pageDetailsMock: AutofillPageDetails;

    beforeEach(function () {
      pageDetailsMock = createAutofillPageDetailsMock();
    });

    it("returns an empty FormData array if no password fields are found", function () {
      jest.spyOn(AutofillService, "loadPasswordFields");

      const formData = autofillService.getFormsWithPasswordFields(pageDetailsMock);

      expect(AutofillService.loadPasswordFields).toHaveBeenCalledWith(
        pageDetailsMock,
        true,
        true,
        false,
        true
      );
      expect(formData).toStrictEqual([]);
    });

    it("returns an FormData array containing a form with it's autofill data", function () {
      const usernameInputField = createInputFieldDataItemMock({
        opid: "username-field",
        form: "validFormId",
        elementNumber: 1,
      });
      const passwordInputField = createInputFieldDataItemMock({
        opid: "password-field",
        type: "password",
        form: "validFormId",
        elementNumber: 2,
      });
      pageDetailsMock.fields = [usernameInputField, passwordInputField];

      const formData = autofillService.getFormsWithPasswordFields(pageDetailsMock);

      expect(formData).toStrictEqual([
        {
          form: pageDetailsMock.forms.validFormId,
          password: pageDetailsMock.fields[1],
          passwords: [pageDetailsMock.fields[1]],
          username: pageDetailsMock.fields[0],
        },
      ]);
    });

    it("narrows down three passwords that are present on a page to a single password field to autofill when only one form element is present on the page", function () {
      const usernameInputField = createInputFieldDataItemMock({
        opid: "username-field",
        form: "validFormId",
        elementNumber: 1,
      });
      const passwordInputField = createInputFieldDataItemMock({
        opid: "password-field",
        type: "password",
        form: "validFormId",
        elementNumber: 2,
      });
      const secondPasswordInputField = createInputFieldDataItemMock({
        opid: "another-password-field",
        type: "password",
        form: undefined,
        elementNumber: 3,
      });
      const thirdPasswordInputField = createInputFieldDataItemMock({
        opid: "a-third-password-field",
        type: "password",
        form: undefined,
        elementNumber: 4,
      });
      pageDetailsMock.fields = [
        usernameInputField,
        passwordInputField,
        secondPasswordInputField,
        thirdPasswordInputField,
      ];

      const formData = autofillService.getFormsWithPasswordFields(pageDetailsMock);

      expect(formData).toStrictEqual([
        {
          form: pageDetailsMock.forms.validFormId,
          password: pageDetailsMock.fields[1],
          passwords: [
            pageDetailsMock.fields[1],
            { ...pageDetailsMock.fields[2], form: pageDetailsMock.fields[1].form },
            { ...pageDetailsMock.fields[3], form: pageDetailsMock.fields[1].form },
          ],
          username: pageDetailsMock.fields[0],
        },
      ]);
    });
  });

  describe("doAutoFill", function () {
    let autofillOptions: AutoFillOptions;
    const nothingToAutofillError = "Nothing to auto-fill.";
    const didNotAutofillError = "Did not auto-fill.";

    beforeEach(function () {
      autofillOptions = {
        cipher: mock<CipherView>({
          id: "cipherId",
          type: CipherType.Login,
        }),
        pageDetails: [
          {
            frameId: 1,
            tab: createChromeTabMock(),
            details: createAutofillPageDetailsMock({
              fields: [
                createInputFieldDataItemMock({
                  opid: "username-field",
                  form: "validFormId",
                  elementNumber: 1,
                }),
                createInputFieldDataItemMock({
                  opid: "password-field",
                  type: "password",
                  form: "validFormId",
                  elementNumber: 2,
                }),
              ],
            }),
          },
        ],
        tab: createChromeTabMock(),
      };
      autofillOptions.cipher.fields = [mock<FieldView>({ name: "username" })];
      autofillOptions.cipher.login.matchesUri = jest.fn().mockReturnValue(true);
      autofillOptions.cipher.login.username = "username";
      autofillOptions.cipher.login.password = "password";
    });

    describe("given a set of autofill options that are incomplete", function () {
      it("throws an error if the tab is not provided", async function () {
        autofillOptions.tab = undefined;

        try {
          await autofillService.doAutoFill(autofillOptions);
          triggerTestFailure();
        } catch (error) {
          expect(error.message).toBe(nothingToAutofillError);
        }
      });

      it("throws an error if the cipher is not provided", async function () {
        autofillOptions.cipher = undefined;

        try {
          await autofillService.doAutoFill(autofillOptions);
          triggerTestFailure();
        } catch (error) {
          expect(error.message).toBe(nothingToAutofillError);
        }
      });

      it("throws an error if the page details are not provided", async function () {
        autofillOptions.pageDetails = undefined;

        try {
          await autofillService.doAutoFill(autofillOptions);
          triggerTestFailure();
        } catch (error) {
          expect(error.message).toBe(nothingToAutofillError);
        }
      });

      it("throws an error if the page details are empty", async function () {
        autofillOptions.pageDetails = [];

        try {
          await autofillService.doAutoFill(autofillOptions);
          triggerTestFailure();
        } catch (error) {
          expect(error.message).toBe(nothingToAutofillError);
        }
      });

      it("throws an error if an autofill did not occur for any of the passed pages", async function () {
        autofillOptions.tab.url = "https://a-different-url.com";

        try {
          await autofillService.doAutoFill(autofillOptions);
          triggerTestFailure();
        } catch (error) {
          expect(error.message).toBe(didNotAutofillError);
        }
      });
    });

    it("will autofill login data for a page", async function () {
      jest.spyOn(stateService, "getCanAccessPremium");
      jest.spyOn(stateService, "getDefaultUriMatch");
      jest.spyOn(autofillService as any, "generateFillScript");
      jest.spyOn(autofillService as any, "generateLoginFillScript");
      jest.spyOn(logService, "info");
      jest.spyOn(cipherService, "updateLastUsedDate");
      jest.spyOn(eventCollectionService, "collect");

      const autofillResult = await autofillService.doAutoFill(autofillOptions);

      const currentAutofillPageDetails = autofillOptions.pageDetails[0];
      expect(stateService.getCanAccessPremium).toHaveBeenCalled();
      expect(stateService.getDefaultUriMatch).toHaveBeenCalled();
      expect(autofillService["generateFillScript"]).toHaveBeenCalledWith(
        currentAutofillPageDetails.details,
        {
          skipUsernameOnlyFill: autofillOptions.skipUsernameOnlyFill || false,
          onlyEmptyFields: autofillOptions.onlyEmptyFields || false,
          onlyVisibleFields: autofillOptions.onlyVisibleFields || false,
          fillNewPassword: autofillOptions.fillNewPassword || false,
          cipher: autofillOptions.cipher,
          tabUrl: autofillOptions.tab.url,
          defaultUriMatch: 0,
        }
      );
      expect(autofillService["generateLoginFillScript"]).toHaveBeenCalled();
      expect(logService.info).not.toHaveBeenCalled();
      expect(cipherService.updateLastUsedDate).toHaveBeenCalledWith(autofillOptions.cipher.id);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        autofillOptions.pageDetails[0].tab.id,
        {
          command: "fillForm",
          fillScript: {
            autosubmit: null,
            documentUUID: currentAutofillPageDetails.details.documentUUID,
            metadata: {},
            options: {},
            properties: {
              delay_between_operations: 20,
            },
            savedUrls: [],
            script: [
              ["click_on_opid", "username-field"],
              ["focus_by_opid", "username-field"],
              ["fill_by_opid", "username-field", "username"],
              ["click_on_opid", "password-field"],
              ["focus_by_opid", "password-field"],
              ["fill_by_opid", "password-field", "password"],
              ["focus_by_opid", "password-field"],
            ],
            untrustedIframe: false,
          },
          url: currentAutofillPageDetails.tab.url,
        },
        {
          frameId: currentAutofillPageDetails.frameId,
        },
        expect.any(Function)
      );
      expect(eventCollectionService.collect).toHaveBeenCalledWith(
        EventType.Cipher_ClientAutofilled,
        autofillOptions.cipher.id
      );
      expect(autofillResult).toBeNull();
    });

    it("will autofill card data for a page", async function () {
      autofillOptions.cipher.type = CipherType.Card;
      autofillOptions.cipher.card = mock<CardView>({
        cardholderName: "cardholderName",
      });
      autofillOptions.pageDetails[0].details.fields = [
        createInputFieldDataItemMock({
          opid: "cardholderName",
          form: "validFormId",
          elementNumber: 2,
          autoCompleteType: "cc-name",
        }),
      ];
      jest.spyOn(autofillService as any, "generateCardFillScript");
      jest.spyOn(eventCollectionService, "collect");

      await autofillService.doAutoFill(autofillOptions);

      expect(autofillService["generateCardFillScript"]).toHaveBeenCalled();
      expect(chrome.tabs.sendMessage).toHaveBeenCalled();
      expect(eventCollectionService.collect).toHaveBeenCalledWith(
        EventType.Cipher_ClientAutofilled,
        autofillOptions.cipher.id
      );
    });

    it("will autofill identity data for a page", async function () {
      autofillOptions.cipher.type = CipherType.Identity;
      autofillOptions.cipher.identity = mock<IdentityView>({
        firstName: "firstName",
        middleName: "middleName",
        lastName: "lastName",
      });
      autofillOptions.pageDetails[0].details.fields = [
        createInputFieldDataItemMock({
          opid: "full-name",
          form: "validFormId",
          elementNumber: 2,
          autoCompleteType: "full-name",
        }),
      ];
      jest.spyOn(autofillService as any, "generateIdentityFillScript");
      jest.spyOn(eventCollectionService, "collect");

      await autofillService.doAutoFill(autofillOptions);

      expect(autofillService["generateIdentityFillScript"]).toHaveBeenCalled();
      expect(chrome.tabs.sendMessage).toHaveBeenCalled();
      expect(eventCollectionService.collect).toHaveBeenCalledWith(
        EventType.Cipher_ClientAutofilled,
        autofillOptions.cipher.id
      );
    });

    it("blocks autofill on an untrusted iframe", async function () {
      autofillOptions.allowUntrustedIframe = false;
      autofillOptions.cipher.login.matchesUri = jest.fn().mockReturnValueOnce(false);
      jest.spyOn(logService, "info");

      try {
        await autofillService.doAutoFill(autofillOptions);
        triggerTestFailure();
      } catch (error) {
        expect(logService.info).toHaveBeenCalledWith(
          "Auto-fill on page load was blocked due to an untrusted iframe."
        );
        expect(error.message).toBe(didNotAutofillError);
      }
    });

    it("allows autofill on an untrusted iframe if the passed option allowing untrusted iframes is set to true", async function () {
      autofillOptions.allowUntrustedIframe = true;
      autofillOptions.cipher.login.matchesUri = jest.fn().mockReturnValue(false);
      jest.spyOn(logService, "info");

      await autofillService.doAutoFill(autofillOptions);

      expect(logService.info).not.toHaveBeenCalledWith(
        "Auto-fill on page load was blocked due to an untrusted iframe."
      );
    });

    it("skips updating the cipher's last used date if the passed options indicate that we should skip the last used cipher", async function () {
      autofillOptions.skipLastUsed = true;
      jest.spyOn(cipherService, "updateLastUsedDate");

      await autofillService.doAutoFill(autofillOptions);

      expect(cipherService.updateLastUsedDate).not.toHaveBeenCalled();
    });

    it("returns a TOTP value", async function () {
      const totpCode = "123456";
      autofillOptions.cipher.login.totp = "totp";
      jest.spyOn(stateService, "getDisableAutoTotpCopy").mockResolvedValueOnce(false);
      jest.spyOn(totpService, "getCode").mockReturnValueOnce(Promise.resolve(totpCode));

      const autofillResult = await autofillService.doAutoFill(autofillOptions);

      expect(stateService.getDisableAutoTotpCopy).toHaveBeenCalled();
      expect(totpService.getCode).toHaveBeenCalledWith(autofillOptions.cipher.login.totp);
      expect(autofillResult).toBe(totpCode);
    });

    it("returns a null value if the cipher type is not for a Login", async function () {
      autofillOptions.cipher.type = CipherType.Identity;
      autofillOptions.cipher.identity = mock<IdentityView>();

      const autofillResult = await autofillService.doAutoFill(autofillOptions);

      expect(autofillResult).toBeNull();
    });

    it("returns a null value if the login does not contain a TOTP value", async function () {
      autofillOptions.cipher.login.totp = undefined;
      jest.spyOn(stateService, "getDisableAutoTotpCopy");
      jest.spyOn(totpService, "getCode");

      const autofillResult = await autofillService.doAutoFill(autofillOptions);

      expect(stateService.getDisableAutoTotpCopy).not.toHaveBeenCalled();
      expect(totpService.getCode).not.toHaveBeenCalled();
      expect(autofillResult).toBeNull();
    });

    it("returns a null value if the user cannot access premium and the organization does not use TOTP", async function () {
      autofillOptions.cipher.login.totp = "totp";
      autofillOptions.cipher.organizationUseTotp = false;
      jest.spyOn(stateService, "getCanAccessPremium").mockResolvedValueOnce(false);

      const autofillResult = await autofillService.doAutoFill(autofillOptions);

      expect(autofillResult).toBeNull();
    });
  });

  describe("inUntrustedIframe", function () {
    it("returns a false value if the passed pageUrl is equal to the options tabUrl", function () {
      const pageUrl = "https://www.example.com";
      const tabUrl = "https://www.example.com";
      const generateFillScriptOptions = createGenerateFillScriptOptionsMock({ tabUrl });
      generateFillScriptOptions.cipher.login.matchesUri = jest.fn().mockReturnValueOnce(true);
      jest.spyOn(settingsService, "getEquivalentDomains");

      const result = autofillService["inUntrustedIframe"](pageUrl, generateFillScriptOptions);

      expect(settingsService.getEquivalentDomains).not.toHaveBeenCalled();
      expect(generateFillScriptOptions.cipher.login.matchesUri).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it("returns a false value if the passed pageUrl matches the domain of the tabUrl", function () {
      const pageUrl = "https://subdomain.example.com";
      const tabUrl = "https://www.example.com";
      const equivalentDomains = new Set(["example.com"]);
      const generateFillScriptOptions = createGenerateFillScriptOptionsMock({ tabUrl });
      generateFillScriptOptions.cipher.login.matchesUri = jest.fn().mockReturnValueOnce(true);
      jest.spyOn(settingsService as any, "getEquivalentDomains").mockReturnValue(equivalentDomains);

      const result = autofillService["inUntrustedIframe"](pageUrl, generateFillScriptOptions);

      expect(settingsService.getEquivalentDomains).toHaveBeenCalledWith(pageUrl);
      expect(generateFillScriptOptions.cipher.login.matchesUri).toHaveBeenCalledWith(
        pageUrl,
        equivalentDomains,
        generateFillScriptOptions.defaultUriMatch
      );
      expect(result).toBe(false);
    });

    it("returns a true value if the passed pageUrl does not match the domain of the tabUrl", function () {
      const pageUrl = "https://subdomain.example.com";
      const tabUrl = "https://www.not-example.com";
      const equivalentDomains = new Set(["not-example.com"]);
      const generateFillScriptOptions = createGenerateFillScriptOptionsMock({ tabUrl });
      generateFillScriptOptions.cipher.login.matchesUri = jest.fn().mockReturnValueOnce(false);
      jest.spyOn(settingsService as any, "getEquivalentDomains").mockReturnValue(equivalentDomains);

      const result = autofillService["inUntrustedIframe"](pageUrl, generateFillScriptOptions);

      expect(settingsService.getEquivalentDomains).toHaveBeenCalledWith(pageUrl);
      expect(generateFillScriptOptions.cipher.login.matchesUri).toHaveBeenCalledWith(
        pageUrl,
        equivalentDomains,
        generateFillScriptOptions.defaultUriMatch
      );
      expect(result).toBe(true);
    });
  });

  describe("forCustomFieldsOnly", function () {
    it("returns a true value if the passed field has a tag name of `span`", function () {
      const field = createInputFieldDataItemMock({ tagName: "span" });

      const result = AutofillService.forCustomFieldsOnly(field);

      expect(result).toBe(true);
    });

    it("returns a false value if the passed field does not have a tag name of `span`", function () {
      const field = createInputFieldDataItemMock({ tagName: "input" });

      const result = AutofillService.forCustomFieldsOnly(field);

      expect(result).toBe(false);
    });
  });
});
