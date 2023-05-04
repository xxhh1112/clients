import { mock, mockReset } from "jest-mock-extended";

import { LogService } from "@bitwarden/common/abstractions/log.service";
import { EventCollectionService } from "@bitwarden/common/services/event/event-collection.service";
import { SettingsService } from "@bitwarden/common/services/settings.service";
import { TotpService } from "@bitwarden/common/services/totp.service";
import { CipherService } from "@bitwarden/common/vault/services/cipher.service";

import { BrowserStateService } from "../../services/browser-state.service";
import AutofillPageDetails from "../models/autofill-page-details";

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
    mockReset(cipherService);

    autofillService = new AutofillService(
      cipherService,
      stateService,
      totpService,
      eventCollectionService,
      logService,
      settingsService
    );
  });

  describe("getFormsWithPasswordFields", function () {
    let pageDetailsMock: AutofillPageDetails;

    beforeEach(function () {
      pageDetailsMock = {
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
      };
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
      jest.spyOn(AutofillService, "loadPasswordFields");
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
  });
});

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
