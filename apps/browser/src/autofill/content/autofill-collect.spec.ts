import { FillableControl, FormElement, FormElementWithAttribute } from "../types";

import AutofillCollect from "./autofill-collect";

const mockLoginForm = `
  <div id="root">
    <form>
      <input type="text" id="username" />
      <input type="password" />
    </form>
  </div>
`;

describe("AutofillCollect", function () {
  let autofillCollect: any;

  beforeEach(function () {
    jest.clearAllMocks();
    document.body.innerHTML = mockLoginForm;
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
            htmlClass: null,
            tabindex: null,
            title: "",
            tagName: "input",
            "label-tag": usernameFieldLabel,
            "label-data": null,
            "label-aria": null,
            "label-top": null,
            "label-right": passwordFieldLabel,
            "label-left": usernameFieldLabel,
            placeholder: "",
            rel: null,
            type: "text",
            value: "",
            checked: false,
            autoCompleteType: "",
            disabled: false,
            readonly: false,
            selectInfo: null,
            form: "__form__0",
            "aria-hidden": false,
            "aria-disabled": false,
            "aria-haspopup": false,
            "data-stripe": null,
          },
          {
            opid: "__1",
            elementNumber: 1,
            maxLength: null,
            visible: true,
            viewable: false,
            htmlID: passwordFieldId,
            htmlName: passwordFieldName,
            htmlClass: null,
            tabindex: null,
            title: "",
            tagName: "input",
            "label-tag": passwordFieldLabel,
            "label-data": null,
            "label-aria": null,
            "label-top": null,
            "label-right": "",
            "label-left": passwordFieldLabel,
            placeholder: "",
            rel: null,
            type: "password",
            value: "",
            checked: false,
            autoCompleteType: "",
            disabled: false,
            readonly: false,
            selectInfo: null,
            form: "__form__0",
            "aria-hidden": false,
            "aria-disabled": false,
            "aria-haspopup": false,
            "data-stripe": null,
          },
        ],
        collectedTimestamp: expect.any(Number),
      });
    });
  });

  describe("buildAutofillFormsData", function () {
    it("returns an object of AutofillForm objects with the form id as a key", function () {
      const documentTitle = "Test Page";
      const formId1 = "validFormId";
      const formAction1 = "https://example.com/";
      const formMethod1 = "post";
      const formName1 = "validFormName";
      const formId2 = "validFormId2";
      const formAction2 = "https://example2.com/";
      const formMethod2 = "get";
      const formName2 = "validFormName2";
      document.title = documentTitle;
      document.body.innerHTML = `
        <form id="${formId1}" action="${formAction1}" method="${formMethod1}" name="${formName1}">
            <label for="usernameFieldId">usernameFieldLabel</label>
            <input type="text" id="usernameFieldId" name="usernameFieldName" />
            <label for="passwordFieldId">passwordFieldLabel</label>
            <input type="password" id="passwordFieldId" name="passwordFieldName" />
        </form>
        <form id="${formId2}" action="${formAction2}" method="${formMethod2}" name="${formName2}">
            <label for="searchField">searchFieldLabel</label>
            <input type="search" id="searchField" name="searchFieldName" />
        </form>
      `;

      const autofillFormsData = autofillCollect["buildAutofillFormsData"]();

      expect(autofillFormsData).toStrictEqual({
        __form__0: {
          opid: "__form__0",
          htmlAction: formAction1,
          htmlName: formName1,
          htmlID: formId1,
          htmlMethod: formMethod1,
        },
        __form__1: {
          opid: "__form__1",
          htmlAction: formAction2,
          htmlName: formName2,
          htmlID: formId2,
          htmlMethod: formMethod2,
        },
      });
    });
  });

  describe("getAutofillFieldElements", function () {
    it("returns all form elements from the targeted document if no limit is set", function () {
      document.body.innerHTML = mockLoginForm;

      const formElements: FormElement[] = autofillCollect["getAutofillFieldElements"]();
      const elementStringsToCheck = formElements.map(({ outerHTML }) => outerHTML);

      expect(elementStringsToCheck).toEqual([
        '<input type="text" id="username">',
        '<input type="password">',
      ]);
    });

    it("returns up to 2 (passed as `limit`) form elements from the targeted document with more than 2 form elements", function () {
      document.body.innerHTML = `
        <div>
          <span data-bwautofill="true">included span</span>
          <textarea name="user-bio" rows="10" cols="42">Tell us about yourself...</textarea>
          <span>ignored span</span>
          <select><option value="1">Option 1</option></select>
          <label for="username">username</label>
          <input type="text" id="username" />
          <input type="password" />
          <span data-bwautofill="true">another included span</span>
        </div>
      `;

      const formElements: FormElement[] = autofillCollect["getAutofillFieldElements"](2);
      const elementStringsToCheck = formElements.map(({ outerHTML }) => outerHTML);

      expect(elementStringsToCheck).toEqual([
        '<span data-bwautofill="true">included span</span>',
        '<textarea name="user-bio" rows="10" cols="42">Tell us about yourself...</textarea>',
      ]);
    });

    it("returns form elements from the targeted document, ignoring input types `hidden`, `submit`, `reset`, `button`, `image`, `file`, and inputs tagged with `data-bwignore`, while giving lower order priority to `checkbox` and `radio` inputs if the returned list is truncated by `limit", function () {
      document.body.innerHTML = `
        <div>
          <fieldset>
            <legend>Select an option:</legend>
            <div>
              <input type="radio" value="option-a" />
              <label for="option-a">Option A: Options B & C</label>
            </div>
            <div>
              <input type="radio" value="option-b" />
              <label for="option-b">Option B: Options A & C</label>
            </div>
            <div>
              <input type="radio" value="option-c" />
              <label for="option-c">Option C: Options A & B</label>
            </div>
          </fieldset>
          <span data-bwautofill="true">included span</span>
          <textarea name="user-bio" rows="10" cols="42">Tell us about yourself...</textarea>
          <span>ignored span</span>
          <input type="checkbox" name="doYouWantToCheck" />
          <label for="doYouWantToCheck">Do you want to skip checking this box?</label>
          <select><option value="1">Option 1</option></select>
          <label for="username">username</label>
          <input type="text" data-bwignore value="None" />
          <input type="hidden" value="of" />
          <input type="submit" value="these" />
          <input type="reset" value="inputs" />
          <input type="button" value="should" />
          <input type="image" src="be" />
          <input type="file" multiple id="returned" />
          <input type="text" id="username" />
          <input type="password" />
          <span data-bwautofill="true">another included span</span>
        </div>
      `;

      const formElements: FormElement[] = autofillCollect["getAutofillFieldElements"]();
      const elementStringsToCheck = formElements.map(({ outerHTML }) => outerHTML);

      expect(elementStringsToCheck).toEqual([
        '<input type="radio" value="option-a">',
        '<input type="radio" value="option-b">',
        '<input type="radio" value="option-c">',
        '<span data-bwautofill="true">included span</span>',
        '<textarea name="user-bio" rows="10" cols="42">Tell us about yourself...</textarea>',
        '<input type="checkbox" name="doYouWantToCheck">',
        '<select><option value="1">Option 1</option></select>',
        '<input type="text" id="username">',
        '<input type="password">',
        '<span data-bwautofill="true">another included span</span>',
      ]);
    });

    it("returns form elements from the targeted document while giving lower order priority to `checkbox` and `radio` inputs if the returned list is truncated by `limit`", function () {
      document.body.innerHTML = `
        <div>
          <input type="checkbox" name="doYouWantToCheck" />
          <label for="doYouWantToCheck">Do you want to skip checking this box?</label>
          <textarea name="user-bio" rows="10" cols="42">Tell us about yourself...</textarea>
          <span>ignored span</span>
          <fieldset>
            <legend>Select an option:</legend>
            <div>
              <input type="radio" value="option-a" />
              <label for="option-a">Option A: Options B & C</label>
            </div>
            <div>
              <input type="radio" value="option-b" />
              <label for="option-b">Option B: Options A & C</label>
            </div>
            <div>
              <input type="radio" value="option-c" />
              <label for="option-c">Option C: Options A & B</label>
            </div>
          </fieldset>
          <select><option value="1">Option 1</option></select>
          <label for="username">username</label>
          <input type="text" id="username" />
          <input type="password" />
          <span data-bwautofill="true">another included span</span>
        </div>
      `;

      const truncatedFormElements: FormElement[] = autofillCollect["getAutofillFieldElements"](8);
      const truncatedElementStringsToCheck = truncatedFormElements.map(
        ({ outerHTML }) => outerHTML
      );

      expect(truncatedElementStringsToCheck).toEqual([
        '<textarea name="user-bio" rows="10" cols="42">Tell us about yourself...</textarea>',
        '<select><option value="1">Option 1</option></select>',
        '<input type="text" id="username">',
        '<input type="password">',
        '<span data-bwautofill="true">another included span</span>',
        '<input type="checkbox" name="doYouWantToCheck">',
        '<input type="radio" value="option-a">',
        '<input type="radio" value="option-b">',
      ]);
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

  describe("isTransitionalElement", function () {
    const validElementTags = [
      "html",
      "body",
      "button",
      "form",
      "head",
      "iframe",
      "input",
      "option",
      "script",
      "select",
      "table",
      "textarea",
    ];
    const invalidElementTags = ["div", "span"];

    describe("given a transitional element", function () {
      validElementTags.forEach((tag) => {
        const element = document.createElement(tag);

        it(`returns true if the element tag is a ${tag}`, function () {
          expect(autofillCollect["isTransitionalElement"](element)).toEqual(true);
        });
      });
    });

    describe("given an non-transitional element", function () {
      invalidElementTags.forEach((tag) => {
        const element = document.createElement(tag);

        it(`returns false if the element tag is a ${tag}`, function () {
          expect(autofillCollect["isTransitionalElement"](element)).toEqual(false);
        });
      });
    });

    it(`returns true if the provided element is falsy`, function () {
      expect(autofillCollect["isTransitionalElement"](undefined)).toEqual(true);
    });
  });

  describe("recursivelyGetTextFromPreviousSiblings", function () {
    it("should find text adjacent to the target element likely to be a label", function () {
      document.body.innerHTML = `
        <div>
          Text about things
          <div>some things</div>
          <div>
            <h3>Stuff Section Header</h3>
            Other things which are also stuff
            <div style="display:none;"> Not visible text </div>
            <label for="input-tag">something else</label>
            <input id="input-tag" type="text" value="something" />
          </div>
        </div>
      `;
      const textInput = document.querySelector("#input-tag") as FormElementWithAttribute;

      const elementList: string[] =
        autofillCollect["recursivelyGetTextFromPreviousSiblings"](textInput);

      expect(elementList).toEqual([
        "something else",
        "Not visible text",
        "Other things which are also stuff",
        "Stuff Section Header",
      ]);
    });

    it("should stop looking at siblings for label values when a 'new section' element is seen", function () {
      document.body.innerHTML = `
        <div>
          Text about things
          <div>some things</div>
          <div>
            <h3>Stuff Section Header</h3>
            Other things which are also stuff
            <div style="display:none;">Not a label</div>
            <input type=text />
            <label for="input-tag">something else</label>
            <input id="input-tag" type="text" value="something" />
          </div>
        </div>
      `;

      const textInput = document.querySelector("#input-tag") as FormElementWithAttribute;
      const elementList: string[] =
        autofillCollect["recursivelyGetTextFromPreviousSiblings"](textInput);

      expect(elementList).toEqual(["something else"]);
    });

    it("should keep looking for labels in parents when there are no siblings of the target element", function () {
      document.body.innerHTML = `
        <div>
          Text about things
          <input type="text" />
          <div>some things</div>
          <div>
            <input id="input-tag" type="text" value="something" />
          </div>
        </div>
      `;

      const textInput = document.querySelector("#input-tag") as FormElementWithAttribute;
      const elementList: string[] =
        autofillCollect["recursivelyGetTextFromPreviousSiblings"](textInput);

      expect(elementList).toEqual(["some things"]);
    });

    it("should find label in parent sibling last child if no other label candidates have been encountered and there are no text nodes along the way", function () {
      document.body.innerHTML = `
        <div>
          <div>
            <div>not the most relevant things</div>
            <div>some nested things</div>
            <div>
              <input id="input-tag" type="text" value="something" />
            </div>
          </div>
        </div>
      `;

      const textInput = document.querySelector("#input-tag") as FormElementWithAttribute;
      const elementList: string[] =
        autofillCollect["recursivelyGetTextFromPreviousSiblings"](textInput);

      expect(elementList).toEqual(["some nested things"]);
    });

    it("should exit early if the target element has no parent element/node", function () {
      const textInput = document.querySelector("html") as HTMLHtmlElement;

      const elementList: string[] =
        autofillCollect["recursivelyGetTextFromPreviousSiblings"](textInput);

      expect(elementList).toEqual([]);
    });
  });

  describe("getPropertyOrAttribute", function () {
    it("returns the value of the named property of the target element if the property exists within the element", function () {
      document.body.innerHTML += '<input type="checkbox" value="userWouldLikeToCheck" checked />';
      const textInput = document.querySelector("#username") as HTMLInputElement;
      textInput.setAttribute("value", "jsmith");
      const checkboxInput = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
      jest.spyOn(textInput, "getAttribute");
      jest.spyOn(checkboxInput, "getAttribute");

      const textInputValue = autofillCollect["getPropertyOrAttribute"](textInput, "value");
      const textInputId = autofillCollect["getPropertyOrAttribute"](textInput, "id");
      const textInputBaseURI = autofillCollect["getPropertyOrAttribute"](textInput, "baseURI");
      const textInputAutofocus = autofillCollect["getPropertyOrAttribute"](textInput, "autofocus");
      const checkboxInputChecked = autofillCollect["getPropertyOrAttribute"](
        checkboxInput,
        "checked"
      );

      expect(textInput.getAttribute).not.toHaveBeenCalled();
      expect(checkboxInput.getAttribute).not.toHaveBeenCalled();
      expect(textInputValue).toEqual("jsmith");
      expect(textInputId).toEqual("username");
      expect(textInputBaseURI).toEqual("http://localhost/");
      expect(textInputAutofocus).toEqual(false);
      expect(checkboxInputChecked).toEqual(true);
    });

    it("returns the value of the named attribute of the element if it does not exist as a property within the element", function () {
      const textInput = document.querySelector("#username") as HTMLInputElement;
      textInput.setAttribute("data-unique-attribute", "unique-value");
      jest.spyOn(textInput, "getAttribute");

      const textInputUniqueAttribute = autofillCollect["getPropertyOrAttribute"](
        textInput,
        "data-unique-attribute"
      );

      expect(textInputUniqueAttribute).toEqual("unique-value");
      expect(textInput.getAttribute).toHaveBeenCalledWith("data-unique-attribute");
    });

    it("returns a null value if the element does not contain the passed attribute name as either a property or attribute value", function () {
      const textInput = document.querySelector("#username") as HTMLInputElement;
      jest.spyOn(textInput, "getAttribute");

      const textInputNonExistentAttribute = autofillCollect["getPropertyOrAttribute"](
        textInput,
        "non-existent-attribute"
      );

      expect(textInputNonExistentAttribute).toEqual(null);
      expect(textInput.getAttribute).toHaveBeenCalledWith("non-existent-attribute");
    });
  });
});
