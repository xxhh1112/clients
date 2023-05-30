import { FillableControl } from "../types";

import AutofillCollect from "./autofill-collect";

describe("AutofillCollect", function () {
  let autofillCollect: any;

  beforeEach(function () {
    jest.clearAllMocks();
    document.body.innerHTML = "";
    autofillCollect = new AutofillCollect();
  });

  describe("getPageDetails", function () {
    it("returns an object containing information about the curren page as well as autofill data for the forms and fields of the page", function () {
      const documentTitle = "Test Page";
      const formId = "validFormId";
      const formAction = "https://example.com/";
      const formMethod = "post";
      const formName = "validFormName";
      const usernameFieldId = "usernameField";
      const usernameFieldName = "username";
      const usernameFieldLabel = "User Name";
      const passwordFieldId = "passwordField";
      const passwordFieldName = "password";
      const passwordFieldLabel = "Password";
      document.title = documentTitle;
      document.body.innerHTML = `
        <form id="${formId}" action="${formAction}" method="${formMethod}" name="${formName}">
            <label for="${usernameFieldId}">${usernameFieldLabel}</label>
            <input type="text" id="${usernameFieldId}" name="${usernameFieldName}" />
            <label for="${passwordFieldId}">${passwordFieldLabel}</label>
            <input type="password" id="${passwordFieldId}" name="${passwordFieldName}" />
        </form>
      `;
      jest.spyOn(autofillCollect, "buildAutofillFormsData");
      jest.spyOn(autofillCollect, "buildAutofillFieldsData");

      const pageDetails = autofillCollect.getPageDetails();

      expect(autofillCollect["buildAutofillFormsData"]).toHaveBeenCalled();
      expect(autofillCollect["buildAutofillFieldsData"]).toHaveBeenCalled();
      expect(pageDetails).toStrictEqual({
        title: documentTitle,
        url: window.location.href,
        documentUrl: document.location.href,
        forms: {
          __form__0: {
            opid: "__form__0",
            htmlAction: formAction,
            htmlName: formName,
            htmlID: formId,
            htmlMethod: formMethod,
          },
        },
        fields: [
          {
            opid: "__0",
            elementNumber: 0,
            maxLength: null,
            visible: true,
            viewable: false,
            htmlID: usernameFieldId,
            htmlName: usernameFieldName,
            htmlClass: "",
            tabindex: "",
            title: "",
            tagName: "input",
            "label-tag": usernameFieldLabel,
            "label-data": "",
            "label-aria": "",
            "label-top": null,
            "label-right": passwordFieldLabel,
            "label-left": usernameFieldLabel,
            placeholder: "",
            rel: "",
            type: "text",
            value: "",
            checked: false,
            autoCompleteType: null,
            disabled: false,
            readonly: false,
            selectInfo: null,
            form: "__form__0",
            "aria-hidden": false,
            "aria-disabled": false,
            "aria-haspopup": false,
            "data-stripe": "",
          },
          {
            opid: "__1",
            elementNumber: 1,
            maxLength: null,
            visible: true,
            viewable: false,
            htmlID: passwordFieldId,
            htmlName: passwordFieldName,
            htmlClass: "",
            tabindex: "",
            title: "",
            tagName: "input",
            "label-tag": passwordFieldLabel,
            "label-data": "",
            "label-aria": "",
            "label-top": null,
            "label-right": "",
            "label-left": passwordFieldLabel,
            placeholder: "",
            rel: "",
            type: "password",
            value: "",
            checked: false,
            autoCompleteType: null,
            disabled: false,
            readonly: false,
            selectInfo: null,
            form: "__form__0",
            "aria-hidden": false,
            "aria-disabled": false,
            "aria-haspopup": false,
            "data-stripe": "",
          },
        ],
        collectedTimestamp: expect.any(Number),
      });
    });
  });

  describe("getAutofillFieldLabelTag", function () {
    beforeEach(function () {
      jest.spyOn(autofillCollect, "createLabelElementsTag");
      jest.spyOn(document, "querySelectorAll");
    });

    it("returns the label tag early if the passed element contains any labels", function () {
      document.body.innerHTML = `
        <label for="username-id">Username</label>
        <input type="text" id="username-id" name="username" />

      `;
      const element = document.querySelector("#username-id") as FillableControl;

      const labelTag = autofillCollect["getAutofillFieldLabelTag"](element);

      expect(autofillCollect.createLabelElementsTag).toHaveBeenCalledWith(new Set(element.labels));
      expect(document.querySelectorAll).not.toHaveBeenCalled();
      expect(labelTag).toEqual("Username");
    });

    it("queries all labels associated with the element's id", function () {
      document.body.innerHTML = `
        <label for="country-id">Country</label>
        <span id="country-id"></span>
      `;
      const element = document.querySelector("#country-id") as FillableControl;
      const elementLabel = document.querySelector("label[for='country-id']");

      const labelTag = autofillCollect["getAutofillFieldLabelTag"](element);

      expect(document.querySelectorAll).toHaveBeenCalledWith(`label[for="${element.id}"]`);
      expect(autofillCollect.createLabelElementsTag).toHaveBeenCalledWith(new Set([elementLabel]));
      expect(labelTag).toEqual("Country");
    });

    it("queries all labels associated with the element's name", function () {
      document.body.innerHTML = `
        <label for="country-name">Country</label>
        <select name="country-name"></select>
      `;
      const element = document.querySelector("select") as FillableControl;
      const elementLabel = document.querySelector("label[for='country-name']");

      const labelTag = autofillCollect["getAutofillFieldLabelTag"](element);

      expect(document.querySelectorAll).not.toHaveBeenCalledWith(`label[for="${element.id}"]`);
      expect(document.querySelectorAll).toHaveBeenCalledWith(`label[for="${element.name}"]`);
      expect(autofillCollect.createLabelElementsTag).toHaveBeenCalledWith(new Set([elementLabel]));
      expect(labelTag).toEqual("Country");
    });

    it("will not add duplicate labels that are found to the label tag", function () {
      document.body.innerHTML = `
        <label for="country-name">Country</label>
        <div id="country-name" name="country-name"></div>
      `;
      const element = document.querySelector("#country-name") as FillableControl;
      element.name = "country-name";
      const elementLabel = document.querySelector("label[for='country-name']");

      const labelTag = autofillCollect["getAutofillFieldLabelTag"](element);

      expect(document.querySelectorAll).toHaveBeenCalledWith(
        `label[for="${element.id}"], label[for="${element.name}"]`
      );
      expect(autofillCollect.createLabelElementsTag).toHaveBeenCalledWith(new Set([elementLabel]));
      expect(labelTag).toEqual("Country");
    });

    it("will attempt to identify the label of an element from its parent element", function () {
      document.body.innerHTML = `<label>
        Username
        <input type="text" id="username-id">
      </label>`;
      const element = document.querySelector("#username-id") as FillableControl;
      const elementLabel = element.parentElement;

      const labelTag = autofillCollect["getAutofillFieldLabelTag"](element);

      expect(autofillCollect.createLabelElementsTag).toHaveBeenCalledWith(new Set([elementLabel]));
      expect(labelTag).toEqual("Username");
    });

    it("will attempt to identify the label of an element from a `dt` element associated with the element's parent", function () {
      document.body.innerHTML = `
        <dl>
          <dt id="label-element">Username</dt>
          <dd>
            <input type="text" id="username-id">
          </dd>
        </dl>
      `;
      const element = document.querySelector("#username-id") as FillableControl;
      const elementLabel = document.querySelector("#label-element");

      const labelTag = autofillCollect["getAutofillFieldLabelTag"](element);

      expect(autofillCollect.createLabelElementsTag).toHaveBeenCalledWith(new Set([elementLabel]));
      expect(labelTag).toEqual("Username");
    });

    it("will return an empty string value if no labels can be found for an element", function () {
      document.body.innerHTML = `
        <input type="text" id="username-id">
      `;
      const element = document.querySelector("#username-id") as FillableControl;

      const labelTag = autofillCollect["getAutofillFieldLabelTag"](element);

      expect(labelTag).toEqual("");
    });
  });
});
