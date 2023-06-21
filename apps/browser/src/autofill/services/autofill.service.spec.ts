import { mock, mockReset } from "jest-mock-extended";

import {
  EventType,
  FieldType,
  LinkedIdType,
  LoginLinkedId,
  UriMatchType,
} from "@bitwarden/common/enums";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { EventCollectionService } from "@bitwarden/common/services/event/event-collection.service";
import { SettingsService } from "@bitwarden/common/services/settings.service";
import { TotpService } from "@bitwarden/common/services/totp.service";
import { CipherRepromptType } from "@bitwarden/common/vault/enums/cipher-reprompt-type";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";
import { CardView } from "@bitwarden/common/vault/models/view/card.view";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { FieldView } from "@bitwarden/common/vault/models/view/field.view";
import { IdentityView } from "@bitwarden/common/vault/models/view/identity.view";
import { LoginUriView } from "@bitwarden/common/vault/models/view/login-uri.view";
import { LoginView } from "@bitwarden/common/vault/models/view/login.view";
import { CipherService } from "@bitwarden/common/vault/services/cipher.service";

import {
  createAutofillFieldMock,
  createAutofillPageDetailsMock,
  createAutofillScriptMock,
  createChromeTabMock,
  createGenerateFillScriptOptionsMock,
} from "../../../jest/autofill-mocks";
import { triggerTestFailure } from "../../../jest/testing-utils";
import { BrowserApi } from "../../platform/browser/browser-api";
import { BrowserStateService } from "../../platform/services/browser-state.service";
import AutofillField from "../models/autofill-field";
import AutofillPageDetails from "../models/autofill-page-details";
import AutofillScript from "../models/autofill-script";

import {
  AutoFillOptions,
  GenerateFillScriptOptions,
  PageDetail,
} from "./abstractions/autofill.service";
import { AutoFillConstants } from "./autofill-constants";
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

    it("will check for a hidden username field", function () {
      const usernameInputField = createAutofillFieldMock({
        opid: "username-field",
        form: "validFormId",
        elementNumber: 1,
        isViewable: false,
        readonly: true,
      });
      const passwordInputField = createAutofillFieldMock({
        opid: "password-field",
        type: "password",
        form: "validFormId",
        elementNumber: 2,
      });
      pageDetailsMock.fields = [usernameInputField, passwordInputField];
      jest.spyOn(autofillService as any, "findUsernameField");

      const formData = autofillService.getFormsWithPasswordFields(pageDetailsMock);

      expect(autofillService["findUsernameField"]).toHaveBeenCalledWith(
        pageDetailsMock,
        passwordInputField,
        true,
        true,
        false
      );
      expect(formData).toStrictEqual([
        {
          form: pageDetailsMock.forms.validFormId,
          password: pageDetailsMock.fields[1],
          passwords: [pageDetailsMock.fields[1]],
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
            metadata: {},
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

    it("returns early if the fillScript cannot be generated", async function () {
      jest.spyOn(autofillService as any, "generateFillScript").mockReturnValueOnce(undefined);
      jest.spyOn(BrowserApi, "tabSendMessage");

      try {
        await autofillService.doAutoFill(autofillOptions);
        triggerTestFailure();
      } catch (error) {
        expect(autofillService["generateFillScript"]).toHaveBeenCalled();
        expect(BrowserApi.tabSendMessage).not.toHaveBeenCalled();
        expect(error.message).toBe(didNotAutofillError);
      }
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

    it("returns a null value if the user has disabled `auto TOTP copy`", async function () {
      autofillOptions.cipher.login.totp = "totp";
      autofillOptions.cipher.organizationUseTotp = true;
      jest.spyOn(stateService, "getCanAccessPremium").mockResolvedValueOnce(true);
      jest.spyOn(stateService, "getDisableAutoTotpCopy").mockResolvedValueOnce(true);

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
          metadata: {},
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
          metadata: {},
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
          metadata: {},
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
    let defaultLoginUriView: LoginUriView;

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
      defaultLoginUriView = mock<LoginUriView>({
        uri: "https://www.example.com",
        match: UriMatchType.Domain,
      });
      options = createGenerateFillScriptOptionsMock();
      options.cipher.login = mock<LoginView>({
        uris: [defaultLoginUriView],
      });
      options.cipher.login.matchesUri = jest.fn().mockReturnValue(true);
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

    describe("given a list of login uri views", function () {
      it("returns an empty array of saved login uri views if the login cipher has no login uri views", function () {
        options.cipher.login.uris = [];

        const value = autofillService["generateLoginFillScript"](
          fillScript,
          pageDetails,
          filledFields,
          options
        );

        expect(value.savedUrls).toStrictEqual([]);
      });

      it("returns a list of saved login uri views within the fill script", function () {
        const secondUriView = mock<LoginUriView>({
          uri: "https://www.second-example.com",
        });
        const thirdUriView = mock<LoginUriView>({
          uri: "https://www.third-example.com",
        });
        options.cipher.login.uris = [defaultLoginUriView, secondUriView, thirdUriView];

        const value = autofillService["generateLoginFillScript"](
          fillScript,
          pageDetails,
          filledFields,
          options
        );

        expect(value.savedUrls).toStrictEqual([
          defaultLoginUriView.uri,
          secondUriView.uri,
          thirdUriView.uri,
        ]);
      });

      it("skips adding any login uri views that have a UriMatchType of Never to the list of saved urls", function () {
        const secondUriView = mock<LoginUriView>({
          uri: "https://www.second-example.com",
        });
        const thirdUriView = mock<LoginUriView>({
          uri: "https://www.third-example.com",
          match: UriMatchType.Never,
        });
        options.cipher.login.uris = [defaultLoginUriView, secondUriView, thirdUriView];

        const value = autofillService["generateLoginFillScript"](
          fillScript,
          pageDetails,
          filledFields,
          options
        );

        expect(value.savedUrls).toStrictEqual([defaultLoginUriView.uri, secondUriView.uri]);
        expect(value.savedUrls).not.toContain(thirdUriView.uri);
      });
    });

    describe("given a valid set of page details and autofill options", function () {
      let usernameField: AutofillField;
      let usernameFieldView: FieldView;
      let passwordField: AutofillField;
      let passwordFieldView: FieldView;

      beforeEach(function () {
        usernameField = createAutofillFieldMock({
          opid: "username",
          form: "validFormId",
          elementNumber: 1,
        });
        usernameFieldView = mock<FieldView>({
          name: "username",
        });
        passwordField = createAutofillFieldMock({
          opid: "password",
          type: "password",
          form: "validFormId",
          elementNumber: 2,
        });
        passwordFieldView = mock<FieldView>({
          name: "password",
        });
        pageDetails.fields = [usernameField, passwordField];
        options.cipher.fields = [usernameFieldView, passwordFieldView];
        options.cipher.login.matchesUri = jest.fn().mockReturnValue(true);
        options.cipher.login.username = "username";
        options.cipher.login.password = "password";
      });

      it("attempts to load the password fields from hidden and read only elements if no visible password fields are found within the page details", function () {
        pageDetails.fields = [
          createAutofillFieldMock({
            opid: "password-field",
            type: "password",
            viewable: true,
            readonly: true,
          }),
        ];
        jest.spyOn(AutofillService, "loadPasswordFields");

        autofillService["generateLoginFillScript"](fillScript, pageDetails, filledFields, options);

        expect(AutofillService.loadPasswordFields).toHaveBeenCalledTimes(2);
        expect(AutofillService.loadPasswordFields).toHaveBeenNthCalledWith(
          1,
          pageDetails,
          false,
          false,
          options.onlyEmptyFields,
          options.fillNewPassword
        );
        expect(AutofillService.loadPasswordFields).toHaveBeenNthCalledWith(
          2,
          pageDetails,
          true,
          true,
          options.onlyEmptyFields,
          options.fillNewPassword
        );
      });

      describe("given a valid list of forms within the passed page details", function () {
        beforeEach(function () {
          usernameField.viewable = false;
          usernameField.readonly = true;
          jest.spyOn(autofillService as any, "findUsernameField");
        });

        it("will attempt to find a username field from hidden fields if no visible username fields are found", function () {
          autofillService["generateLoginFillScript"](
            fillScript,
            pageDetails,
            filledFields,
            options
          );

          expect(autofillService["findUsernameField"]).toHaveBeenCalledTimes(2);
          expect(autofillService["findUsernameField"]).toHaveBeenNthCalledWith(
            1,
            pageDetails,
            passwordField,
            false,
            false,
            false
          );
          expect(autofillService["findUsernameField"]).toHaveBeenNthCalledWith(
            2,
            pageDetails,
            passwordField,
            true,
            true,
            false
          );
        });

        it("will not attempt to find a username field from hidden fields if the passed options indicate only visible fields should be referenced", function () {
          options.onlyVisibleFields = true;

          autofillService["generateLoginFillScript"](
            fillScript,
            pageDetails,
            filledFields,
            options
          );

          expect(autofillService["findUsernameField"]).toHaveBeenCalledTimes(1);
          expect(autofillService["findUsernameField"]).toHaveBeenNthCalledWith(
            1,
            pageDetails,
            passwordField,
            false,
            false,
            false
          );
          expect(autofillService["findUsernameField"]).not.toHaveBeenNthCalledWith(
            2,
            pageDetails,
            passwordField,
            true,
            true,
            false
          );
        });
      });

      describe("given an empty list of fields within the passed page details", function () {
        beforeEach(function () {
          pageDetails.forms = undefined;
          jest.spyOn(autofillService as any, "findUsernameField");
        });

        it("will attempt to match a password field that does not contain a form to a username field", function () {
          autofillService["generateLoginFillScript"](
            fillScript,
            pageDetails,
            filledFields,
            options
          );

          expect(autofillService["findUsernameField"]).toHaveBeenCalledTimes(1);
          expect(autofillService["findUsernameField"]).toHaveBeenCalledWith(
            pageDetails,
            passwordField,
            false,
            false,
            true
          );
        });

        it("will attempt to match a password field that does not contain a form to a username field that is not visible", function () {
          usernameField.viewable = false;
          usernameField.readonly = true;

          autofillService["generateLoginFillScript"](
            fillScript,
            pageDetails,
            filledFields,
            options
          );

          expect(autofillService["findUsernameField"]).toHaveBeenCalledTimes(2);
          expect(autofillService["findUsernameField"]).toHaveBeenNthCalledWith(
            1,
            pageDetails,
            passwordField,
            false,
            false,
            true
          );
          expect(autofillService["findUsernameField"]).toHaveBeenNthCalledWith(
            2,
            pageDetails,
            passwordField,
            true,
            true,
            true
          );
        });

        it("will not attempt to match a password field that does not contain a form to a username field that is not visible if the passed options indicate only visible fields", function () {
          usernameField.viewable = false;
          usernameField.readonly = true;
          options.onlyVisibleFields = true;

          autofillService["generateLoginFillScript"](
            fillScript,
            pageDetails,
            filledFields,
            options
          );

          expect(autofillService["findUsernameField"]).toHaveBeenCalledTimes(1);
          expect(autofillService["findUsernameField"]).toHaveBeenNthCalledWith(
            1,
            pageDetails,
            passwordField,
            false,
            false,
            true
          );
          expect(autofillService["findUsernameField"]).not.toHaveBeenNthCalledWith(
            2,
            pageDetails,
            passwordField,
            true,
            true,
            true
          );
        });
      });

      describe("given a set of page details that does not contain a password field", function () {
        let emailField: AutofillField;
        let emailFieldView: FieldView;
        let telephoneField: AutofillField;
        let telephoneFieldView: FieldView;
        let nonViewableField: AutofillField;
        let nonViewableFieldView: FieldView;

        beforeEach(function () {
          usernameField.htmlName = "username";
          emailField = createAutofillFieldMock({
            opid: "email",
            type: "email",
            form: "validFormId",
            elementNumber: 2,
          });
          emailFieldView = mock<FieldView>({
            name: "email",
          });
          telephoneField = createAutofillFieldMock({
            opid: "telephone",
            type: "tel",
            form: "validFormId",
            elementNumber: 3,
          });
          telephoneFieldView = mock<FieldView>({
            name: "telephone",
          });
          nonViewableField = createAutofillFieldMock({
            opid: "non-viewable",
            form: "validFormId",
            viewable: false,
            elementNumber: 4,
          });
          nonViewableFieldView = mock<FieldView>({
            name: "non-viewable",
          });
          pageDetails.fields = [usernameField, emailField, telephoneField, nonViewableField];
          options.cipher.fields = [
            usernameFieldView,
            emailFieldView,
            telephoneFieldView,
            nonViewableFieldView,
          ];
          jest.spyOn(AutofillService, "fieldIsFuzzyMatch");
          jest.spyOn(AutofillService, "fillByOpid");
        });

        it("will attempt to fuzzy match a username to a viewable text, email or tel field if no password fields are found and the username fill is not being skipped", function () {
          autofillService["generateLoginFillScript"](
            fillScript,
            pageDetails,
            filledFields,
            options
          );

          expect(AutofillService.fieldIsFuzzyMatch).toHaveBeenCalledTimes(3);
          expect(AutofillService.fieldIsFuzzyMatch).toHaveBeenNthCalledWith(
            1,
            usernameField,
            AutoFillConstants.UsernameFieldNames
          );
          expect(AutofillService.fieldIsFuzzyMatch).toHaveBeenNthCalledWith(
            2,
            emailField,
            AutoFillConstants.UsernameFieldNames
          );
          expect(AutofillService.fieldIsFuzzyMatch).toHaveBeenNthCalledWith(
            3,
            telephoneField,
            AutoFillConstants.UsernameFieldNames
          );
          expect(AutofillService.fieldIsFuzzyMatch).not.toHaveBeenNthCalledWith(
            4,
            nonViewableField,
            AutoFillConstants.UsernameFieldNames
          );
          expect(AutofillService.fillByOpid).toHaveBeenCalledTimes(1);
          expect(AutofillService.fillByOpid).toHaveBeenCalledWith(
            fillScript,
            usernameField,
            options.cipher.login.username
          );
        });
      });

      it("returns a value indicating if the page url is in an untrusted iframe", function () {
        jest.spyOn(autofillService as any, "inUntrustedIframe").mockReturnValueOnce(true);

        const value = autofillService["generateLoginFillScript"](
          fillScript,
          pageDetails,
          filledFields,
          options
        );

        expect(value.untrustedIframe).toBe(true);
      });

      it("returns a fill script used to autofill a login item", function () {
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

        expect(autofillService["inUntrustedIframe"]).toHaveBeenCalledWith(pageDetails.url, options);
        expect(AutofillService.loadPasswordFields).toHaveBeenCalledWith(
          pageDetails,
          false,
          false,
          options.onlyEmptyFields,
          options.fillNewPassword
        );
        expect(autofillService["findUsernameField"]).toHaveBeenCalledWith(
          pageDetails,
          passwordField,
          false,
          false,
          false
        );
        expect(AutofillService.fieldIsFuzzyMatch).not.toHaveBeenCalled();
        expect(AutofillService.fillByOpid).toHaveBeenCalledTimes(2);
        expect(AutofillService.fillByOpid).toHaveBeenNthCalledWith(
          1,
          fillScript,
          usernameField,
          options.cipher.login.username
        );
        expect(AutofillService.fillByOpid).toHaveBeenNthCalledWith(
          2,
          fillScript,
          passwordField,
          options.cipher.login.password
        );
        expect(AutofillService.setFillScriptForFocus).toHaveBeenCalledWith(
          filledFields,
          fillScript
        );
        expect(value).toStrictEqual({
          autosubmit: null,
          metadata: {},
          properties: { delay_between_operations: 20 },
          savedUrls: ["https://www.example.com"],
          script: [
            ["click_on_opid", "default-field"],
            ["focus_by_opid", "default-field"],
            ["fill_by_opid", "default-field", "default"],
            ["click_on_opid", "username"],
            ["focus_by_opid", "username"],
            ["fill_by_opid", "username", "username"],
            ["click_on_opid", "password"],
            ["focus_by_opid", "password"],
            ["fill_by_opid", "password", "password"],
            ["focus_by_opid", "password"],
          ],
          itemType: "",
          untrustedIframe: false,
        });
      });
    });
  });

  describe("generateCardFillScript", function () {
    let fillScript: AutofillScript;
    let pageDetails: AutofillPageDetails;
    let filledFields: { [id: string]: AutofillField };
    let options: GenerateFillScriptOptions;

    beforeEach(function () {
      fillScript = createAutofillScriptMock({
        script: [],
      });
      pageDetails = createAutofillPageDetailsMock();
      filledFields = {
        "cardholderName-field": createAutofillFieldMock({
          opid: "cardholderName-field",
          form: "validFormId",
          elementNumber: 1,
          htmlName: "cc-name",
        }),
        "cardNumber-field": createAutofillFieldMock({
          opid: "cardNumber-field",
          form: "validFormId",
          elementNumber: 2,
          htmlName: "cc-number",
        }),
        "expMonth-field": createAutofillFieldMock({
          opid: "expMonth-field",
          form: "validFormId",
          elementNumber: 3,
          htmlName: "exp-month",
        }),
        "expYear-field": createAutofillFieldMock({
          opid: "expYear-field",
          form: "validFormId",
          elementNumber: 4,
          htmlName: "exp-year",
        }),
        "code-field": createAutofillFieldMock({
          opid: "code-field",
          form: "validFormId",
          elementNumber: 1,
          htmlName: "cvc",
        }),
      };
      options = createGenerateFillScriptOptionsMock();
      options.cipher.card = mock<CardView>();
    });

    it("returns null if the passed options contains a cipher with no card view", function () {
      options.cipher.card = undefined;

      const value = autofillService["generateCardFillScript"](
        fillScript,
        pageDetails,
        filledFields,
        options
      );

      expect(value).toBeNull();
    });

    describe("given an invalid autofill field", function () {
      const unmodifiedFillScriptValues: AutofillScript = {
        autosubmit: null,
        metadata: {},
        properties: { delay_between_operations: 20 },
        savedUrls: [],
        script: [],
        itemType: "",
        untrustedIframe: false,
      };

      it("returns an unmodified fill script when the field is a `span` field", function () {
        const spanField = createAutofillFieldMock({
          opid: "span-field",
          form: "validFormId",
          elementNumber: 5,
          htmlName: "spanField",
          tagName: "span",
        });
        pageDetails.fields = [spanField];
        jest.spyOn(AutofillService, "forCustomFieldsOnly");
        jest.spyOn(autofillService as any, "isExcludedType");

        const value = autofillService["generateCardFillScript"](
          fillScript,
          pageDetails,
          filledFields,
          options
        );

        expect(AutofillService.forCustomFieldsOnly).toHaveBeenCalledWith(spanField);
        expect(autofillService["isExcludedType"]).not.toHaveBeenCalled();
        expect(value).toStrictEqual(unmodifiedFillScriptValues);
      });

      AutoFillConstants.ExcludedAutofillTypes.forEach((excludedType) => {
        it(`returns an unmodified fill script when the field has a '${excludedType}' type`, function () {
          const invalidField = createAutofillFieldMock({
            opid: `${excludedType}-field`,
            form: "validFormId",
            elementNumber: 5,
            htmlName: "invalidField",
            type: excludedType,
          });
          pageDetails.fields = [invalidField];
          jest.spyOn(AutofillService, "forCustomFieldsOnly");
          jest.spyOn(autofillService as any, "isExcludedType");

          const value = autofillService["generateCardFillScript"](
            fillScript,
            pageDetails,
            filledFields,
            options
          );

          expect(AutofillService.forCustomFieldsOnly).toHaveBeenCalledWith(invalidField);
          expect(autofillService["isExcludedType"]).toHaveBeenCalledWith(
            invalidField.type,
            AutoFillConstants.ExcludedAutofillTypes
          );
          expect(value).toStrictEqual(unmodifiedFillScriptValues);
        });
      });

      it("returns an unmodified fill script when the field is not viewable", function () {
        const notViewableField = createAutofillFieldMock({
          opid: "invalid-field",
          form: "validFormId",
          elementNumber: 5,
          htmlName: "invalidField",
          type: "text",
          viewable: false,
        });
        pageDetails.fields = [notViewableField];
        jest.spyOn(AutofillService, "forCustomFieldsOnly");
        jest.spyOn(autofillService as any, "isExcludedType");

        const value = autofillService["generateCardFillScript"](
          fillScript,
          pageDetails,
          filledFields,
          options
        );

        expect(AutofillService.forCustomFieldsOnly).toHaveBeenCalledWith(notViewableField);
        expect(autofillService["isExcludedType"]).toHaveBeenCalled();
        expect(value).toStrictEqual(unmodifiedFillScriptValues);
      });
    });

    describe("given a valid set of autofill fields", function () {
      let cardholderNameField: AutofillField;
      let cardholderNameFieldView: FieldView;
      let cardNumberField: AutofillField;
      let cardNumberFieldView: FieldView;
      let expMonthField: AutofillField;
      let expMonthFieldView: FieldView;
      let expYearField: AutofillField;
      let expYearFieldView: FieldView;
      let codeField: AutofillField;
      let codeFieldView: FieldView;
      let brandField: AutofillField;
      let brandFieldView: FieldView;

      beforeEach(function () {
        cardholderNameField = createAutofillFieldMock({
          opid: "cardholderName",
          form: "validFormId",
          elementNumber: 1,
          htmlName: "cc-name",
        });
        cardholderNameFieldView = mock<FieldView>({ name: "cardholderName" });
        cardNumberField = createAutofillFieldMock({
          opid: "cardNumber",
          form: "validFormId",
          elementNumber: 2,
          htmlName: "cc-number",
        });
        cardNumberFieldView = mock<FieldView>({ name: "cardNumber" });
        expMonthField = createAutofillFieldMock({
          opid: "expMonth",
          form: "validFormId",
          elementNumber: 3,
          htmlName: "exp-month",
        });
        expMonthFieldView = mock<FieldView>({ name: "expMonth" });
        expYearField = createAutofillFieldMock({
          opid: "expYear",
          form: "validFormId",
          elementNumber: 4,
          htmlName: "exp-year",
        });
        expYearFieldView = mock<FieldView>({ name: "expYear" });
        codeField = createAutofillFieldMock({
          opid: "code",
          form: "validFormId",
          elementNumber: 1,
          htmlName: "cvc",
        });
        brandField = createAutofillFieldMock({
          opid: "brand",
          form: "validFormId",
          elementNumber: 1,
          htmlName: "card-brand",
        });
        brandFieldView = mock<FieldView>({ name: "brand" });
        codeFieldView = mock<FieldView>({ name: "code" });
        pageDetails.fields = [
          cardholderNameField,
          cardNumberField,
          expMonthField,
          expYearField,
          codeField,
          brandField,
        ];
        options.cipher.fields = [
          cardholderNameFieldView,
          cardNumberFieldView,
          expMonthFieldView,
          expYearFieldView,
          codeFieldView,
          brandFieldView,
        ];
        options.cipher.card.cardholderName = "testCardholderName";
        options.cipher.card.number = "testCardNumber";
        options.cipher.card.expMonth = "testExpMonth";
        options.cipher.card.expYear = "testExpYear";
        options.cipher.card.code = "testCode";
        options.cipher.card.brand = "testBrand";
        jest.spyOn(AutofillService, "forCustomFieldsOnly");
        jest.spyOn(autofillService as any, "isExcludedType");
        jest.spyOn(AutofillService as any, "isFieldMatch");
        jest.spyOn(autofillService as any, "makeScriptAction");
        jest.spyOn(AutofillService, "hasValue");
        jest.spyOn(autofillService as any, "fieldAttrsContain");
        jest.spyOn(AutofillService, "fillByOpid");
        jest.spyOn(autofillService as any, "makeScriptActionWithValue");
      });

      it("returns a fill script containing all of the passed card fields", function () {
        const value = autofillService["generateCardFillScript"](
          fillScript,
          pageDetails,
          filledFields,
          options
        );

        expect(AutofillService.forCustomFieldsOnly).toHaveBeenCalledTimes(6);
        expect(autofillService["isExcludedType"]).toHaveBeenCalledTimes(6);
        expect(AutofillService["isFieldMatch"]).toHaveBeenCalled();
        expect(autofillService["makeScriptAction"]).toHaveBeenCalledTimes(4);
        expect(AutofillService["hasValue"]).toHaveBeenCalledTimes(6);
        expect(autofillService["fieldAttrsContain"]).toHaveBeenCalledTimes(3);
        expect(AutofillService["fillByOpid"]).toHaveBeenCalledTimes(6);
        expect(autofillService["makeScriptActionWithValue"]).toHaveBeenCalledTimes(4);
        expect(value).toStrictEqual({
          autosubmit: null,
          itemType: "",
          metadata: {},
          properties: {
            delay_between_operations: 20,
          },
          savedUrls: [],
          script: [
            ["click_on_opid", "cardholderName"],
            ["focus_by_opid", "cardholderName"],
            ["fill_by_opid", "cardholderName", "testCardholderName"],
            ["click_on_opid", "cardNumber"],
            ["focus_by_opid", "cardNumber"],
            ["fill_by_opid", "cardNumber", "testCardNumber"],
            ["click_on_opid", "code"],
            ["focus_by_opid", "code"],
            ["fill_by_opid", "code", "testCode"],
            ["click_on_opid", "brand"],
            ["focus_by_opid", "brand"],
            ["fill_by_opid", "brand", "testBrand"],
            ["click_on_opid", "expMonth"],
            ["focus_by_opid", "expMonth"],
            ["fill_by_opid", "expMonth", "testExpMonth"],
            ["click_on_opid", "expYear"],
            ["focus_by_opid", "expYear"],
            ["fill_by_opid", "expYear", "testExpYear"],
          ],
          untrustedIframe: false,
        });
      });
    });

    describe("given an expiration month field", function () {
      let expMonthField: AutofillField;
      let expMonthFieldView: FieldView;

      beforeEach(function () {
        expMonthField = createAutofillFieldMock({
          opid: "expMonth",
          form: "validFormId",
          elementNumber: 3,
          htmlName: "exp-month",
          selectInfo: {
            options: [
              ["January", "01"],
              ["February", "02"],
              ["March", "03"],
              ["April", "04"],
              ["May", "05"],
              ["June", "06"],
              ["July", "07"],
              ["August", "08"],
              ["September", "09"],
              ["October", "10"],
              ["November", "11"],
              ["December", "12"],
            ],
          },
        });
        expMonthFieldView = mock<FieldView>({ name: "expMonth" });
        pageDetails.fields = [expMonthField];
        options.cipher.fields = [expMonthFieldView];
        options.cipher.card.expMonth = "05";
      });

      it("returns an expiration month parsed from found select options within the field", function () {
        const testValue = "sometestvalue";
        expMonthField.selectInfo.options[4] = ["May", testValue];

        const value = autofillService["generateCardFillScript"](
          fillScript,
          pageDetails,
          filledFields,
          options
        );

        expect(value.script[2]).toStrictEqual(["fill_by_opid", expMonthField.opid, testValue]);
      });

      it("returns an expiration month parsed from found select options within the field when the select field has an empty option at the end of the list of options", function () {
        const testValue = "sometestvalue";
        expMonthField.selectInfo.options[4] = ["May", testValue];
        expMonthField.selectInfo.options.push(["", ""]);

        const value = autofillService["generateCardFillScript"](
          fillScript,
          pageDetails,
          filledFields,
          options
        );

        expect(value.script[2]).toStrictEqual(["fill_by_opid", expMonthField.opid, testValue]);
      });

      it("returns an expiration month parsed from found select options within the field when the select field has an empty option at the start of the list of options", function () {
        const testValue = "sometestvalue";
        expMonthField.selectInfo.options[4] = ["May", testValue];
        expMonthField.selectInfo.options.unshift(["", ""]);

        const value = autofillService["generateCardFillScript"](
          fillScript,
          pageDetails,
          filledFields,
          options
        );

        expect(value.script[2]).toStrictEqual(["fill_by_opid", expMonthField.opid, testValue]);
      });

      it("returns an expiration month with a zero attached if the field requires two characters, and the vault item has only one character", function () {
        options.cipher.card.expMonth = "5";
        expMonthField.selectInfo = null;
        expMonthField.placeholder = "mm";
        expMonthField.maxLength = 2;

        const value = autofillService["generateCardFillScript"](
          fillScript,
          pageDetails,
          filledFields,
          options
        );

        expect(value.script[2]).toStrictEqual(["fill_by_opid", expMonthField.opid, "05"]);
      });
    });

    describe("given an expiration year field", function () {
      let expYearField: AutofillField;
      let expYearFieldView: FieldView;

      beforeEach(function () {
        expYearField = createAutofillFieldMock({
          opid: "expYear",
          form: "validFormId",
          elementNumber: 3,
          htmlName: "exp-year",
          selectInfo: {
            options: [
              ["2023", "2023"],
              ["2024", "2024"],
              ["2025", "2025"],
            ],
          },
        });
        expYearFieldView = mock<FieldView>({ name: "expYear" });
        pageDetails.fields = [expYearField];
        options.cipher.fields = [expYearFieldView];
        options.cipher.card.expYear = "2024";
      });

      it("returns an expiration year parsed from the select options if an exact match is found for either the select option text or value", function () {
        const someTestValue = "sometestvalue";
        expYearField.selectInfo.options[1] = ["2024", someTestValue];
        options.cipher.card.expYear = someTestValue;

        let value = autofillService["generateCardFillScript"](
          fillScript,
          pageDetails,
          filledFields,
          options
        );

        expect(value.script[2]).toStrictEqual(["fill_by_opid", expYearField.opid, someTestValue]);

        expYearField.selectInfo.options[1] = [someTestValue, "2024"];

        value = autofillService["generateCardFillScript"](
          fillScript,
          pageDetails,
          filledFields,
          options
        );

        expect(value.script[2]).toStrictEqual(["fill_by_opid", expYearField.opid, someTestValue]);
      });

      it("returns an expiration year parsed from the select options if the value of an option contains only two characters and the vault item value contains four characters", function () {
        const yearValue = "26";
        expYearField.selectInfo.options.push(["The year 2026", yearValue]);
        options.cipher.card.expYear = "2026";

        const value = autofillService["generateCardFillScript"](
          fillScript,
          pageDetails,
          filledFields,
          options
        );

        expect(value.script[2]).toStrictEqual(["fill_by_opid", expYearField.opid, yearValue]);
      });

      it("returns an expiration year parsed from the select options if the vault of an option is separated by a colon", function () {
        const yearValue = "26";
        const colonSeparatedYearValue = `2:0${yearValue}`;
        expYearField.selectInfo.options.push(["The year 2026", colonSeparatedYearValue]);
        options.cipher.card.expYear = yearValue;

        const value = autofillService["generateCardFillScript"](
          fillScript,
          pageDetails,
          filledFields,
          options
        );

        expect(value.script[2]).toStrictEqual([
          "fill_by_opid",
          expYearField.opid,
          colonSeparatedYearValue,
        ]);
      });

      it("returns an expiration year with `20` prepended to the vault item value if the field to be filled expects a `yyyy` format but the vault item only has two characters", function () {
        const yearValue = "26";
        expYearField.selectInfo = null;
        expYearField.placeholder = "yyyy";
        expYearField.maxLength = 4;
        options.cipher.card.expYear = yearValue;

        const value = autofillService["generateCardFillScript"](
          fillScript,
          pageDetails,
          filledFields,
          options
        );

        expect(value.script[2]).toStrictEqual([
          "fill_by_opid",
          expYearField.opid,
          `20${yearValue}`,
        ]);
      });

      it("returns an expiration year with only the last two values if the field to be filled expects a `yy` format but the vault item contains four characters", function () {
        const yearValue = "26";
        expYearField.selectInfo = null;
        expYearField.placeholder = "yy";
        expYearField.maxLength = 2;
        options.cipher.card.expYear = `20${yearValue}`;

        const value = autofillService["generateCardFillScript"](
          fillScript,
          pageDetails,
          filledFields,
          options
        );

        expect(value.script[2]).toStrictEqual(["fill_by_opid", expYearField.opid, yearValue]);
      });
    });

    describe("given a generic expiration date field", function () {
      let expirationDateField: AutofillField;
      let expirationDateFieldView: FieldView;

      beforeEach(function () {
        expirationDateField = createAutofillFieldMock({
          opid: "expirationDate",
          form: "validFormId",
          elementNumber: 3,
          htmlName: "expiration-date",
        });
        filledFields["exp-field"] = expirationDateField;
        expirationDateFieldView = mock<FieldView>({ name: "exp" });
        pageDetails.fields = [expirationDateField];
        options.cipher.fields = [expirationDateFieldView];
        options.cipher.card.expMonth = "05";
        options.cipher.card.expYear = "2024";
      });

      const expectedDateFormats = [
        ["mm/yyyy", "05/2024"],
        ["mm/yy", "05/24"],
        ["yyyy/mm", "2024/05"],
        ["yy/mm", "24/05"],
        ["mm-yyyy", "05-2024"],
        ["mm-yy", "05-24"],
        ["yyyy-mm", "2024-05"],
        ["yy-mm", "24-05"],
        ["yyyymm", "202405"],
        ["yymm", "2405"],
        ["mmyyyy", "052024"],
        ["mmyy", "0524"],
      ];
      expectedDateFormats.forEach((dateFormat, index) => {
        it(`returns an expiration date format matching '${dateFormat[0]}'`, function () {
          expirationDateField.placeholder = dateFormat[0];
          if (index === 0) {
            options.cipher.card.expYear = "24";
          }
          if (index === 1) {
            options.cipher.card.expMonth = "5";
          }

          const value = autofillService["generateCardFillScript"](
            fillScript,
            pageDetails,
            filledFields,
            options
          );

          expect(value.script[2]).toStrictEqual(["fill_by_opid", "expirationDate", dateFormat[1]]);
        });
      });

      it("returns an expiration date format matching `yyyy-mm` if no valid format can be identified", function () {
        const value = autofillService["generateCardFillScript"](
          fillScript,
          pageDetails,
          filledFields,
          options
        );

        expect(value.script[2]).toStrictEqual(["fill_by_opid", "expirationDate", "2024-05"]);
      });
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
