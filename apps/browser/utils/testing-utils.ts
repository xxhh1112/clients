import AutofillPageDetails from "../src/autofill/models/autofill-page-details";

function triggerTestFailure() {
  expect(true).toBe("Test has failed.");
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

export {
  triggerTestFailure,
  createInputFieldDataItem,
  createAutofillPageDetailsMock,
  createChromeTabMock,
};
