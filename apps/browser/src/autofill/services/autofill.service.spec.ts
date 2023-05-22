import { mock, mockReset } from "jest-mock-extended";

import { LogService } from "@bitwarden/common/abstractions/log.service";
import { EventType, FieldType, LinkedIdType, LoginLinkedId } from "@bitwarden/common/enums";
import { EventCollectionService } from "@bitwarden/common/services/event/event-collection.service";
import { SettingsService } from "@bitwarden/common/services/settings.service";
import { TotpService } from "@bitwarden/common/services/totp.service";
import { CipherRepromptType } from "@bitwarden/common/vault/enums/cipher-reprompt-type";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";
import { CardView } from "@bitwarden/common/vault/models/view/card.view";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { FieldView } from "@bitwarden/common/vault/models/view/field.view";
import { IdentityView } from "@bitwarden/common/vault/models/view/identity.view";
import { CipherService } from "@bitwarden/common/vault/services/cipher.service";

import {
  triggerTestFailure,
  createAutofillFieldMock,
  createAutofillPageDetailsMock,
  createChromeTabMock,
  createGenerateFillScriptOptionsMock,
  createAutofillScriptMock,
} from "../../../jest/testing-utils";
import { BrowserApi } from "../../browser/browserApi";
import { BrowserStateService } from "../../services/browser-state.service";
import AutofillField from "../models/autofill-field";
import AutofillPageDetails from "../models/autofill-page-details";
import AutofillScript from "../models/autofill-script";

import {
  AutoFillOptions,
  GenerateFillScriptOptions,
  PageDetail,
} from "./abstractions/autofill.service";
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
      const usernameInputField = createAutofillFieldMock({
        opid: "username-field",
        form: "validFormId",
        elementNumber: 1,
      });
      const passwordInputField = createAutofillFieldMock({
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
      const usernameInputField = createAutofillFieldMock({
        opid: "username-field",
        form: "validFormId",
        elementNumber: 1,
      });
      const passwordInputField = createAutofillFieldMock({
        opid: "password-field",
        type: "password",
        form: "validFormId",
        elementNumber: 2,
      });
      const secondPasswordInputField = createAutofillFieldMock({
        opid: "another-password-field",
        type: "password",
        form: undefined,
        elementNumber: 3,
      });
      const thirdPasswordInputField = createAutofillFieldMock({
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
                createAutofillFieldMock({
                  opid: "username-field",
                  form: "validFormId",
                  elementNumber: 1,
                }),
                createAutofillFieldMock({
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
        createAutofillFieldMock({
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
        createAutofillFieldMock({
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

  describe("doAutoFillOnTab", function () {
    let pageDetails: PageDetail[];
    let tab: chrome.tabs.Tab;

    beforeEach(function () {
      tab = createChromeTabMock();
      pageDetails = [
        {
          frameId: 1,
          tab: createChromeTabMock(),
          details: createAutofillPageDetailsMock({
            fields: [
              createAutofillFieldMock({
                opid: "username-field",
                form: "validFormId",
                elementNumber: 1,
              }),
              createAutofillFieldMock({
                opid: "password-field",
                type: "password",
                form: "validFormId",
                elementNumber: 2,
              }),
            ],
          }),
        },
      ];
    });

    describe("given a tab url which does not match a cipher", function () {
      it("will skip autofill and return a null value when triggering on page load", async function () {
        jest.spyOn(autofillService, "doAutoFill");
        jest.spyOn(cipherService, "getNextCipherForUrl");
        jest.spyOn(cipherService, "getLastLaunchedForUrl").mockResolvedValueOnce(null);
        jest.spyOn(cipherService, "getLastUsedForUrl").mockResolvedValueOnce(null);

        const result = await autofillService.doAutoFillOnTab(pageDetails, tab, false);

        expect(cipherService.getNextCipherForUrl).not.toHaveBeenCalled();
        expect(cipherService.getLastLaunchedForUrl).toHaveBeenCalledWith(tab.url, true);
        expect(cipherService.getLastUsedForUrl).toHaveBeenCalledWith(tab.url, true);
        expect(autofillService.doAutoFill).not.toHaveBeenCalled();
        expect(result).toBeNull();
      });

      it("will skip autofill and return a null value when triggering from a keyboard shortcut", async function () {
        jest.spyOn(autofillService, "doAutoFill");
        jest.spyOn(cipherService, "getNextCipherForUrl").mockResolvedValueOnce(null);
        jest.spyOn(cipherService, "getLastLaunchedForUrl").mockResolvedValueOnce(null);
        jest.spyOn(cipherService, "getLastUsedForUrl").mockResolvedValueOnce(null);

        const result = await autofillService.doAutoFillOnTab(pageDetails, tab, true);

        expect(cipherService.getNextCipherForUrl).toHaveBeenCalledWith(tab.url);
        expect(cipherService.getLastLaunchedForUrl).not.toHaveBeenCalled();
        expect(cipherService.getLastUsedForUrl).not.toHaveBeenCalled();
        expect(autofillService.doAutoFill).not.toHaveBeenCalled();
        expect(result).toBeNull();
      });
    });

    describe("given a tab url which matches a cipher", function () {
      let cipher: CipherView;

      beforeEach(function () {
        cipher = mock<CipherView>({
          reprompt: CipherRepromptType.None,
          localData: {
            lastLaunched: Date.now().valueOf(),
          },
        });
      });

      it("will autofill the last launched cipher and return a TOTP value when triggering on page load", async function () {
        const totpCode = "123456";
        const fromCommand = false;
        jest.spyOn(autofillService, "doAutoFill").mockResolvedValueOnce(totpCode);
        jest.spyOn(cipherService, "getLastLaunchedForUrl").mockResolvedValueOnce(cipher);
        jest.spyOn(cipherService, "getLastUsedForUrl");
        jest.spyOn(cipherService, "updateLastUsedIndexForUrl");

        const result = await autofillService.doAutoFillOnTab(pageDetails, tab, fromCommand);

        expect(cipherService.getLastLaunchedForUrl).toHaveBeenCalledWith(tab.url, true);
        expect(cipherService.getLastUsedForUrl).not.toHaveBeenCalled();
        expect(cipherService.updateLastUsedIndexForUrl).not.toHaveBeenCalled();
        expect(autofillService.doAutoFill).toHaveBeenCalledWith({
          tab: tab,
          cipher: cipher,
          pageDetails: pageDetails,
          skipLastUsed: !fromCommand,
          skipUsernameOnlyFill: !fromCommand,
          onlyEmptyFields: !fromCommand,
          onlyVisibleFields: !fromCommand,
          fillNewPassword: fromCommand,
          allowUntrustedIframe: fromCommand,
        });
        expect(result).toBe(totpCode);
      });

      it("will autofill the last used cipher and return a TOTP value when triggering on page load ", async function () {
        cipher.localData.lastLaunched = Date.now().valueOf() - 30001;
        const totpCode = "123456";
        const fromCommand = false;
        jest.spyOn(autofillService, "doAutoFill").mockResolvedValueOnce(totpCode);
        jest.spyOn(cipherService, "getLastLaunchedForUrl").mockResolvedValueOnce(cipher);
        jest.spyOn(cipherService, "getLastUsedForUrl").mockResolvedValueOnce(cipher);
        jest.spyOn(cipherService, "updateLastUsedIndexForUrl");

        const result = await autofillService.doAutoFillOnTab(pageDetails, tab, fromCommand);

        expect(cipherService.getLastLaunchedForUrl).toHaveBeenCalledWith(tab.url, true);
        expect(cipherService.getLastUsedForUrl).toHaveBeenCalledWith(tab.url, true);
        expect(cipherService.updateLastUsedIndexForUrl).not.toHaveBeenCalled();
        expect(autofillService.doAutoFill).toHaveBeenCalledWith({
          tab: tab,
          cipher: cipher,
          pageDetails: pageDetails,
          skipLastUsed: !fromCommand,
          skipUsernameOnlyFill: !fromCommand,
          onlyEmptyFields: !fromCommand,
          onlyVisibleFields: !fromCommand,
          fillNewPassword: fromCommand,
          allowUntrustedIframe: fromCommand,
        });
        expect(result).toBe(totpCode);
      });

      it("will autofill the next cipher, update the last used cipher index, and return a TOTP value when triggering from a keyboard shortcut", async function () {
        const totpCode = "123456";
        const fromCommand = true;
        jest.spyOn(autofillService, "doAutoFill").mockResolvedValueOnce(totpCode);
        jest.spyOn(cipherService, "getNextCipherForUrl").mockResolvedValueOnce(cipher);
        jest.spyOn(cipherService, "updateLastUsedIndexForUrl");

        const result = await autofillService.doAutoFillOnTab(pageDetails, tab, fromCommand);

        expect(cipherService.getNextCipherForUrl).toHaveBeenCalledWith(tab.url);
        expect(cipherService.updateLastUsedIndexForUrl).toHaveBeenCalledWith(tab.url);
        expect(autofillService.doAutoFill).toHaveBeenCalledWith({
          tab: tab,
          cipher: cipher,
          pageDetails: pageDetails,
          skipLastUsed: !fromCommand,
          skipUsernameOnlyFill: !fromCommand,
          onlyEmptyFields: !fromCommand,
          onlyVisibleFields: !fromCommand,
          fillNewPassword: fromCommand,
          allowUntrustedIframe: fromCommand,
        });
        expect(result).toBe(totpCode);
      });

      it("will skip autofill and return a null value if the cipher re-prompt type is not `None`", async function () {
        cipher.reprompt = CipherRepromptType.Password;
        jest.spyOn(autofillService, "doAutoFill");
        jest.spyOn(cipherService, "getNextCipherForUrl").mockResolvedValueOnce(cipher);

        const result = await autofillService.doAutoFillOnTab(pageDetails, tab, true);

        expect(cipherService.getNextCipherForUrl).toHaveBeenCalledWith(tab.url);
        expect(autofillService.doAutoFill).not.toHaveBeenCalled();
        expect(result).toBeNull();
      });
    });
  });

  describe("doAutoFillActiveTab", function () {
    let pageDetails: PageDetail[];
    let tab: chrome.tabs.Tab;

    beforeEach(function () {
      tab = createChromeTabMock();
      pageDetails = [
        {
          frameId: 1,
          tab: createChromeTabMock(),
          details: createAutofillPageDetailsMock({
            fields: [
              createAutofillFieldMock({
                opid: "username-field",
                form: "validFormId",
                elementNumber: 1,
              }),
              createAutofillFieldMock({
                opid: "password-field",
                type: "password",
                form: "validFormId",
                elementNumber: 2,
              }),
            ],
          }),
        },
      ];
    });

    it("returns a null value without doing autofill if the active tab cannot be found", async function () {
      jest.spyOn(autofillService as any, "getActiveTab").mockResolvedValueOnce(undefined);
      jest.spyOn(autofillService, "doAutoFill");

      const result = await autofillService.doAutoFillActiveTab(pageDetails, false);

      expect(autofillService["getActiveTab"]).toHaveBeenCalled();
      expect(autofillService.doAutoFill).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("returns a null value without doing autofill if the active tab url cannot be found", async function () {
      jest.spyOn(autofillService as any, "getActiveTab").mockResolvedValueOnce({
        id: 1,
        url: undefined,
      });
      jest.spyOn(autofillService, "doAutoFill");

      const result = await autofillService.doAutoFillActiveTab(pageDetails, false);

      expect(autofillService["getActiveTab"]).toHaveBeenCalled();
      expect(autofillService.doAutoFill).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("queries the active tab and enacts an autofill on that tab", async function () {
      const totp = "123456";
      const fromCommand = false;
      jest.spyOn(autofillService as any, "getActiveTab").mockResolvedValueOnce(tab);
      jest.spyOn(autofillService, "doAutoFillOnTab").mockResolvedValueOnce(totp);

      const result = await autofillService.doAutoFillActiveTab(pageDetails, fromCommand);

      expect(autofillService["getActiveTab"]).toHaveBeenCalled();
      expect(autofillService.doAutoFillOnTab).toHaveBeenCalledWith(pageDetails, tab, fromCommand);
      expect(result).toBe(totp);
    });
  });

  describe("getActiveTab", function () {
    it("throws are error if a tab cannot be found", async function () {
      jest.spyOn(BrowserApi, "getTabFromCurrentWindow").mockResolvedValueOnce(undefined);

      try {
        await autofillService["getActiveTab"]();
        triggerTestFailure();
      } catch (error) {
        expect(BrowserApi.getTabFromCurrentWindow).toHaveBeenCalled();
        expect(error.message).toBe("No tab found.");
      }
    });

    it("returns the active tab from the current window", async function () {
      const tab = createChromeTabMock();
      jest.spyOn(BrowserApi, "getTabFromCurrentWindow").mockResolvedValueOnce(tab);

      const result = await autofillService["getActiveTab"]();
      expect(BrowserApi.getTabFromCurrentWindow).toHaveBeenCalled();
      expect(result).toBe(tab);
    });
  });

  describe("generateFillScript", function () {
    let defaultUsernameField: AutofillField;
    let defaultUsernameFieldView: FieldView;
    let defaultPasswordField: AutofillField;
    let defaultPasswordFieldView: FieldView;
    let pageDetail: AutofillPageDetails;
    let generateFillScriptOptions: GenerateFillScriptOptions;

    beforeEach(function () {
      defaultUsernameField = createAutofillFieldMock({
        opid: "username-field",
        form: "validFormId",
        htmlID: "username",
        elementNumber: 1,
      });
      defaultUsernameFieldView = mock<FieldView>({
        name: "username",
        value: defaultUsernameField.value,
      });
      defaultPasswordField = createAutofillFieldMock({
        opid: "password-field",
        type: "password",
        form: "validFormId",
        htmlID: "password",
        elementNumber: 2,
      });
      defaultPasswordFieldView = mock<FieldView>({
        name: "password",
        value: defaultPasswordField.value,
      });
      pageDetail = createAutofillPageDetailsMock({
        fields: [defaultUsernameField, defaultPasswordField],
      });
      generateFillScriptOptions = createGenerateFillScriptOptionsMock();
      generateFillScriptOptions.cipher.fields = [
        defaultUsernameFieldView,
        defaultPasswordFieldView,
      ];
    });

    it("returns null if the page details are not provided", function () {
      const value = autofillService["generateFillScript"](undefined, generateFillScriptOptions);

      expect(value).toBeNull();
    });

    it("returns null if the passed options do not contain a valid cipher", function () {
      generateFillScriptOptions.cipher = undefined;

      const value = autofillService["generateFillScript"](pageDetail, generateFillScriptOptions);

      expect(value).toBeNull();
    });

    describe("given a valid set of cipher fields and page detail fields", function () {
      it("will not attempt to fill by opid duplicate fields found within the page details", function () {
        const duplicateUsernameField: AutofillField = createAutofillFieldMock({
          opid: "username-field",
          form: "validFormId",
          htmlID: "username",
          elementNumber: 3,
        });
        pageDetail.fields.push(duplicateUsernameField);
        jest.spyOn(generateFillScriptOptions.cipher, "linkedFieldValue");
        jest.spyOn(autofillService as any, "findMatchingFieldIndex");
        jest.spyOn(AutofillService, "fillByOpid");

        autofillService["generateFillScript"](pageDetail, generateFillScriptOptions);

        expect(AutofillService.fillByOpid).not.toHaveBeenCalledWith(
          expect.anything(),
          duplicateUsernameField,
          duplicateUsernameField.value
        );
      });

      it("will not attempt to fill by opid fields that are not viewable and are not a `span` element", function () {
        defaultUsernameField.viewable = false;
        jest.spyOn(AutofillService, "fillByOpid");

        autofillService["generateFillScript"](pageDetail, generateFillScriptOptions);

        expect(AutofillService.fillByOpid).not.toHaveBeenCalledWith(
          expect.anything(),
          defaultUsernameField,
          defaultUsernameField.value
        );
      });

      it("will fill by opid fields that are not viewable but are a `span` element", function () {
        defaultUsernameField.viewable = false;
        defaultUsernameField.tagName = "span";
        jest.spyOn(AutofillService, "fillByOpid");

        autofillService["generateFillScript"](pageDetail, generateFillScriptOptions);

        expect(AutofillService.fillByOpid).toHaveBeenNthCalledWith(
          1,
          expect.anything(),
          defaultUsernameField,
          defaultUsernameField.value
        );
      });

      it("will not attempt to fill by opid fields that do not contain a property that matches the field name", function () {
        defaultUsernameField.htmlID = "does-not-match-username";
        jest.spyOn(AutofillService, "fillByOpid");

        autofillService["generateFillScript"](pageDetail, generateFillScriptOptions);

        expect(AutofillService.fillByOpid).not.toHaveBeenCalledWith(
          expect.anything(),
          defaultUsernameField,
          defaultUsernameField.value
        );
      });

      it("will fill by opid fields that contain a property that matches the field name", function () {
        jest.spyOn(generateFillScriptOptions.cipher, "linkedFieldValue");
        jest.spyOn(autofillService as any, "findMatchingFieldIndex");
        jest.spyOn(AutofillService, "fillByOpid");

        autofillService["generateFillScript"](pageDetail, generateFillScriptOptions);

        expect(autofillService["findMatchingFieldIndex"]).toHaveBeenCalledTimes(2);
        expect(generateFillScriptOptions.cipher.linkedFieldValue).not.toHaveBeenCalled();
        expect(AutofillService.fillByOpid).toHaveBeenNthCalledWith(
          1,
          expect.anything(),
          defaultUsernameField,
          defaultUsernameField.value
        );
        expect(AutofillService.fillByOpid).toHaveBeenNthCalledWith(
          2,
          expect.anything(),
          defaultPasswordField,
          defaultPasswordField.value
        );
      });

      it("it will fill by opid fields of type Linked", function () {
        const fieldLinkedId: LinkedIdType = LoginLinkedId.Username;
        const linkedFieldValue = "linkedFieldValue";
        defaultUsernameFieldView.type = FieldType.Linked;
        defaultUsernameFieldView.linkedId = fieldLinkedId;
        jest
          .spyOn(generateFillScriptOptions.cipher, "linkedFieldValue")
          .mockReturnValueOnce(linkedFieldValue);
        jest.spyOn(AutofillService, "fillByOpid");

        autofillService["generateFillScript"](pageDetail, generateFillScriptOptions);

        expect(generateFillScriptOptions.cipher.linkedFieldValue).toHaveBeenCalledTimes(1);
        expect(generateFillScriptOptions.cipher.linkedFieldValue).toHaveBeenCalledWith(
          fieldLinkedId
        );
        expect(AutofillService.fillByOpid).toHaveBeenNthCalledWith(
          1,
          expect.anything(),
          defaultUsernameField,
          linkedFieldValue
        );
        expect(AutofillService.fillByOpid).toHaveBeenNthCalledWith(
          2,
          expect.anything(),
          defaultPasswordField,
          defaultPasswordField.value
        );
      });

      it("will fill by opid fields of type Boolean", function () {
        defaultUsernameFieldView.type = FieldType.Boolean;
        defaultUsernameFieldView.value = "true";
        jest.spyOn(generateFillScriptOptions.cipher, "linkedFieldValue");
        jest.spyOn(AutofillService, "fillByOpid");

        autofillService["generateFillScript"](pageDetail, generateFillScriptOptions);

        expect(generateFillScriptOptions.cipher.linkedFieldValue).not.toHaveBeenCalled();
        expect(AutofillService.fillByOpid).toHaveBeenNthCalledWith(
          1,
          expect.anything(),
          defaultUsernameField,
          defaultUsernameFieldView.value
        );
      });

      it("will fill by opid fields of type Boolean with a value of false if no value is provided", function () {
        defaultUsernameFieldView.type = FieldType.Boolean;
        defaultUsernameFieldView.value = undefined;
        jest.spyOn(AutofillService, "fillByOpid");

        autofillService["generateFillScript"](pageDetail, generateFillScriptOptions);

        expect(AutofillService.fillByOpid).toHaveBeenNthCalledWith(
          1,
          expect.anything(),
          defaultUsernameField,
          "false"
        );
      });
    });

    it("returns a fill script generated for a login autofill", function () {
      const fillScriptMock = createAutofillScriptMock(
        {},
        { "username-field": "username-value", "password-value": "password-value" }
      );
      generateFillScriptOptions.cipher.type = CipherType.Login;
      jest
        .spyOn(autofillService as any, "generateLoginFillScript")
        .mockReturnValueOnce(fillScriptMock);

      const value = autofillService["generateFillScript"](pageDetail, generateFillScriptOptions);

      expect(autofillService["generateLoginFillScript"]).toHaveBeenCalledWith(
        {
          autosubmit: null,
          documentUUID: "documentUUID",
          metadata: {},
          options: {},
          properties: {},
          script: [
            ["click_on_opid", "username-field"],
            ["focus_by_opid", "username-field"],
            ["fill_by_opid", "username-field", "default-value"],
            ["click_on_opid", "password-field"],
            ["focus_by_opid", "password-field"],
            ["fill_by_opid", "password-field", "default-value"],
          ],
        },
        pageDetail,
        {
          "password-field": defaultPasswordField,
          "username-field": defaultUsernameField,
        },
        generateFillScriptOptions
      );
      expect(value).toBe(fillScriptMock);
    });

    it("returns a fill script generated for a card autofill", function () {
      const fillScriptMock = createAutofillScriptMock(
        {},
        { "first-name-field": "first-name-value", "last-name-value": "last-name-value" }
      );
      generateFillScriptOptions.cipher.type = CipherType.Card;
      jest
        .spyOn(autofillService as any, "generateCardFillScript")
        .mockReturnValueOnce(fillScriptMock);

      const value = autofillService["generateFillScript"](pageDetail, generateFillScriptOptions);

      expect(autofillService["generateCardFillScript"]).toHaveBeenCalledWith(
        {
          autosubmit: null,
          documentUUID: "documentUUID",
          metadata: {},
          options: {},
          properties: {},
          script: [
            ["click_on_opid", "username-field"],
            ["focus_by_opid", "username-field"],
            ["fill_by_opid", "username-field", "default-value"],
            ["click_on_opid", "password-field"],
            ["focus_by_opid", "password-field"],
            ["fill_by_opid", "password-field", "default-value"],
          ],
        },
        pageDetail,
        {
          "password-field": defaultPasswordField,
          "username-field": defaultUsernameField,
        },
        generateFillScriptOptions
      );
      expect(value).toBe(fillScriptMock);
    });

    it("returns a fill script generated for an identity autofill", function () {
      const fillScriptMock = createAutofillScriptMock(
        {},
        { "first-name-field": "first-name-value", "last-name-value": "last-name-value" }
      );
      generateFillScriptOptions.cipher.type = CipherType.Identity;
      jest
        .spyOn(autofillService as any, "generateIdentityFillScript")
        .mockReturnValueOnce(fillScriptMock);

      const value = autofillService["generateFillScript"](pageDetail, generateFillScriptOptions);

      expect(autofillService["generateIdentityFillScript"]).toHaveBeenCalledWith(
        {
          autosubmit: null,
          documentUUID: "documentUUID",
          metadata: {},
          options: {},
          properties: {},
          script: [
            ["click_on_opid", "username-field"],
            ["focus_by_opid", "username-field"],
            ["fill_by_opid", "username-field", "default-value"],
            ["click_on_opid", "password-field"],
            ["focus_by_opid", "password-field"],
            ["fill_by_opid", "password-field", "default-value"],
          ],
        },
        pageDetail,
        {
          "password-field": defaultPasswordField,
          "username-field": defaultUsernameField,
        },
        generateFillScriptOptions
      );
      expect(value).toBe(fillScriptMock);
    });

    it("returns null if the cipher type is not for a login, card, or identity", function () {
      generateFillScriptOptions.cipher.type = CipherType.SecureNote;

      const value = autofillService["generateFillScript"](pageDetail, generateFillScriptOptions);

      expect(value).toBeNull();
    });
  });

  describe("generateLoginFillScript", function () {
    let fillScript: AutofillScript;
    let pageDetails: AutofillPageDetails;
    let filledFields: { [id: string]: AutofillField };
    let options: GenerateFillScriptOptions;

    beforeEach(function () {
      fillScript = createAutofillScriptMock();
      pageDetails = createAutofillPageDetailsMock();
      filledFields = {
        "username-field": createAutofillFieldMock({
          opid: "username-field",
          form: "validFormId",
          elementNumber: 1,
        }),
        "password-field": createAutofillFieldMock({
          opid: "password-field",
          form: "validFormId",
          elementNumber: 2,
        }),
      };
      options = createGenerateFillScriptOptionsMock();
    });

    it("returns null if the cipher does not have login data", function () {
      options.cipher.login = undefined;
      jest.spyOn(autofillService as any, "inUntrustedIframe");
      jest.spyOn(AutofillService, "loadPasswordFields");
      jest.spyOn(autofillService as any, "findUsernameField");
      jest.spyOn(AutofillService, "fieldIsFuzzyMatch");
      jest.spyOn(AutofillService, "fillByOpid");
      jest.spyOn(AutofillService, "setFillScriptForFocus");

      const value = autofillService["generateLoginFillScript"](
        fillScript,
        pageDetails,
        filledFields,
        options
      );

      expect(autofillService["inUntrustedIframe"]).not.toHaveBeenCalled();
      expect(AutofillService.loadPasswordFields).not.toHaveBeenCalled();
      expect(autofillService["findUsernameField"]).not.toHaveBeenCalled();
      expect(AutofillService.fieldIsFuzzyMatch).not.toHaveBeenCalled();
      expect(AutofillService.fillByOpid).not.toHaveBeenCalled();
      expect(AutofillService.setFillScriptForFocus).not.toHaveBeenCalled();
      expect(value).toBeNull();
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
      const field = createAutofillFieldMock({ tagName: "span" });

      const result = AutofillService.forCustomFieldsOnly(field);

      expect(result).toBe(true);
    });

    it("returns a false value if the passed field does not have a tag name of `span`", function () {
      const field = createAutofillFieldMock({ tagName: "input" });

      const result = AutofillService.forCustomFieldsOnly(field);

      expect(result).toBe(false);
    });
  });
});
