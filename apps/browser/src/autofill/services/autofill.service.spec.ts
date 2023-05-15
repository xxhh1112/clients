import { mock, mockReset } from "jest-mock-extended";

import { LogService } from "@bitwarden/common/abstractions/log.service";
import { EventType } from "@bitwarden/common/enums";
import { EventCollectionService } from "@bitwarden/common/services/event/event-collection.service";
import { SettingsService } from "@bitwarden/common/services/settings.service";
import { TotpService } from "@bitwarden/common/services/totp.service";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { FieldView } from "@bitwarden/common/vault/models/view/field.view";
import { CipherService } from "@bitwarden/common/vault/services/cipher.service";

import { BrowserStateService } from "../../services/browser-state.service";
import AutofillPageDetails from "../models/autofill-page-details";

import { AutoFillOptions } from "./abstractions/autofill.service";
import AutofillService from "./autofill.service";

function triggerTestFailure() {
  expect(true).toBe(false);
}

function createAutofillPageDetailsMock(customFields = {}): AutofillPageDetails {
  return {
    documentUUID: "documentUUID",
    title: "title",
    url: "url",
    documentUrl: "documentUrl",
    forms: {
      validFormId: {
        opid: "opid",
        htmlName: "htmlName",
        htmlID: "htmlID",
        htmlAction: "htmlAction",
        htmlMethod: "htmlMethod",
      },
    },
    fields: [createInputFieldDataItem({ opid: "non-password-field" })],
    collectedTimestamp: 0,
    ...customFields,
  };
}

function createInputFieldDataItem(customFields = {}) {
  return {
    opid: "default-input-field-opid",
    elementNumber: 0,
    visible: true,
    viewable: true,
    htmlID: "default-htmlID",
    htmlName: "default-htmlName",
    htmlClass: "default-htmlClass",
    "label-left": "default-label-left",
    "label-right": "default-label-right",
    "label-top": "default-label-top",
    "label-tag": "default-label-tag",
    "label-aria": "default-label-aria",
    placeholder: "default-placeholder",
    type: "text",
    value: "default-value",
    disabled: false,
    readonly: false,
    onePasswordFieldType: "",
    form: "invalidFormId",
    autoCompleteType: "off",
    selectInfo: "",
    maxLength: 0,
    tagName: "input",
    ...customFields,
  };
}

function createChromeTabMock(customFields = {}): chrome.tabs.Tab {
  return {
    id: 1,
    index: 1,
    pinned: false,
    highlighted: false,
    windowId: 2,
    active: true,
    incognito: false,
    selected: true,
    discarded: false,
    autoDiscardable: false,
    groupId: 2,
    url: "https://tacos.com",
    ...customFields,
  };
}

describe("AutofillService", function () {
  let autofillService: AutofillService;

  const cipherService = mock<CipherService>();
  const stateService = mock<BrowserStateService>();
  const totpService = mock<TotpService>();
  const eventCollectionService = mock<EventCollectionService>();
  const logService = mock<LogService>();
  const settingsService = mock<SettingsService>();

  beforeEach(function () {
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

    it("should return an empty FormData array if no password fields are found", function () {
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

    it("should return an FormData array containing a form with it's autofill data", function () {
      const usernameInputField = createInputFieldDataItem({
        opid: "username-field",
        form: "validFormId",
        elementNumber: 1,
      });
      const passwordInputField = createInputFieldDataItem({
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

    it("should narrow down three passwords that are present on a page to a single password field to autofill when only one form element is present on the page", function () {
      const usernameInputField = createInputFieldDataItem({
        opid: "username-field",
        form: "validFormId",
        elementNumber: 1,
      });
      const passwordInputField = createInputFieldDataItem({
        opid: "password-field",
        type: "password",
        form: "validFormId",
        elementNumber: 2,
      });
      const secondPasswordInputField = createInputFieldDataItem({
        opid: "another-password-field",
        type: "password",
        form: undefined,
        elementNumber: 3,
      });
      const thirdPasswordInputField = createInputFieldDataItem({
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

    beforeEach(function () {
      const pageDetailsMock = createAutofillPageDetailsMock({
        fields: [
          createInputFieldDataItem({
            opid: "username-field",
            form: "validFormId",
            elementNumber: 1,
          }),
          createInputFieldDataItem({
            opid: "password-field",
            type: "password",
            form: "validFormId",
            elementNumber: 2,
          }),
        ],
      });
      autofillOptions = {
        cipher: mock<CipherView>(),
        pageDetails: [
          {
            frameId: 1,
            tab: createChromeTabMock(),
            details: pageDetailsMock,
          },
        ],
        tab: createChromeTabMock(),
      };
    });

    describe("should throw an error when the following occurs", function () {
      const nothingToAutofillError = "Nothing to auto-fill.";
      const didNotAutofillError = "Did not auto-fill.";

      it("the tab is not provided", async function () {
        autofillOptions.tab = undefined;

        try {
          await autofillService.doAutoFill(autofillOptions);
          triggerTestFailure();
        } catch (error) {
          expect(error.message).toBe(nothingToAutofillError);
        }
      });

      it("the cipher is not provided", async function () {
        autofillOptions.cipher = undefined;

        try {
          await autofillService.doAutoFill(autofillOptions);
          triggerTestFailure();
        } catch (error) {
          expect(error.message).toBe(nothingToAutofillError);
        }
      });

      it("the page details are not provided", async function () {
        autofillOptions.pageDetails = undefined;

        try {
          await autofillService.doAutoFill(autofillOptions);
          triggerTestFailure();
        } catch (error) {
          expect(error.message).toBe(nothingToAutofillError);
        }
      });

      it("the page details are empty", async function () {
        autofillOptions.pageDetails = [];

        try {
          await autofillService.doAutoFill(autofillOptions);
          triggerTestFailure();
        } catch (error) {
          expect(error.message).toBe(nothingToAutofillError);
        }
      });

      it("if an autofill did not occur for any of the passed pages", async function () {
        try {
          await autofillService.doAutoFill(autofillOptions);
          triggerTestFailure();
        } catch (error) {
          expect(error.message).toBe(didNotAutofillError);
        }
      });
    });

    it("should autofill login data for a page", async function () {
      const mockFieldView = mock<FieldView>({
        name: "username",
      });
      autofillOptions.cipher.fields = [mockFieldView];
      autofillOptions.cipher.id = "cipherId";
      autofillOptions.cipher.type = CipherType.Login;
      autofillOptions.cipher.login.matchesUri = jest.fn().mockReturnValueOnce(true);
      autofillOptions.cipher.login.username = "username";
      autofillOptions.cipher.login.password = "password";
      jest.spyOn(stateService, "getCanAccessPremium");
      jest.spyOn(stateService, "getDefaultUriMatch");
      jest.spyOn(logService, "info");
      jest.spyOn(cipherService, "updateLastUsedDate");
      jest.spyOn(eventCollectionService, "collect");

      const autofillResult = await autofillService.doAutoFill(autofillOptions);

      const currentAutofillPageDetails = autofillOptions.pageDetails[0];
      expect(stateService.getCanAccessPremium).toHaveBeenCalled();
      expect(stateService.getDefaultUriMatch).toHaveBeenCalled();
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

    it.todo("should return a TOTP value", function () {
      // TODO: Implement a test that shows that a TOTP value is returned when doing autofill.
    });
  });
});
