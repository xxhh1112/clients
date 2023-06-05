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
    it("returns an object containing information about the curren page as well as autofill data for the forms and fields of the page", async function () {
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
      jest.spyOn(autofillCollect, "isElementCurrentlyViewable").mockResolvedValue(true);

      const pageDetails = await autofillCollect.getPageDetails();

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
            viewable: true,
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
            viewable: true,
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

  describe("isNewSectionElement", function () {
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
          expect(autofillCollect["isNewSectionElement"](element)).toEqual(true);
        });
      });
    });

    describe("given an non-transitional element", function () {
      invalidElementTags.forEach((tag) => {
        const element = document.createElement(tag);

        it(`returns false if the element tag is a ${tag}`, function () {
          expect(autofillCollect["isNewSectionElement"](element)).toEqual(false);
        });
      });
    });

    it(`returns true if the provided element is falsy`, function () {
      expect(autofillCollect["isNewSectionElement"](undefined)).toEqual(true);
    });
  });

  describe("getTextContentFromElement", function () {
    it("returns the node value for a text node", function () {
      document.body.innerHTML = `
        <div>
          <label>
            Username Label
            <input type="text" id="username-id">
          </label>
        </div>
      `;
      const element = document.querySelector("#username-id");
      const textNode = element.previousSibling;
      const parsedTextContent = autofillCollect["trimAndRemoveNonPrintableText"](
        textNode.nodeValue
      );
      jest.spyOn(autofillCollect as any, "trimAndRemoveNonPrintableText");

      const textContent = autofillCollect["getTextContentFromElement"](textNode);

      expect(textNode.nodeType).toEqual(Node.TEXT_NODE);
      expect(autofillCollect["trimAndRemoveNonPrintableText"]).toHaveBeenCalledWith(
        textNode.nodeValue
      );
      expect(textContent).toEqual(parsedTextContent);
    });

    it("returns the text content for an element node", function () {
      document.body.innerHTML = `
        <div>
          <label for="username-id">Username Label</label>
          <input type="text" id="username-id">
        </div>
      `;
      const element = document.querySelector('label[for="username-id"]');
      jest.spyOn(autofillCollect as any, "trimAndRemoveNonPrintableText");

      const textContent = autofillCollect["getTextContentFromElement"](element);

      expect(element.nodeType).toEqual(Node.ELEMENT_NODE);
      expect(autofillCollect["trimAndRemoveNonPrintableText"]).toHaveBeenCalledWith(
        element.textContent
      );
      expect(textContent).toEqual(element.textContent);
    });
  });

  describe("trimAndRemoveNonPrintableText", function () {
    it("returns an empty string if no text content is passed", function () {
      const textContent = autofillCollect["trimAndRemoveNonPrintableText"](undefined);

      expect(textContent).toEqual("");
    });

    it("returns a trimmed string with all non-printable text removed", function () {
      const nonParsedText = `Hello!\nThis is a \t
      test   string.\x0B\x08`;

      const parsedText = autofillCollect["trimAndRemoveNonPrintableText"](nonParsedText);

      expect(parsedText).toEqual("Hello! This is a test string.");
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

  describe("getElementValue", function () {
    it("returns an empty string of passed input elements whose value is not set", function () {
      document.body.innerHTML += `
        <input type="checkbox" value="aTestValue" />
        <input id="hidden-input" type="hidden" />
        <span id="span-input"></span>
      `;
      const textInput = document.querySelector("#username") as HTMLInputElement;
      const checkboxInput = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
      const hiddenInput = document.querySelector("#hidden-input") as HTMLInputElement;
      const spanInput = document.querySelector("#span-input") as HTMLInputElement;

      const textInputValue = autofillCollect["getElementValue"](textInput);
      const checkboxInputValue = autofillCollect["getElementValue"](checkboxInput);
      const hiddenInputValue = autofillCollect["getElementValue"](hiddenInput);
      const spanInputValue = autofillCollect["getElementValue"](spanInput);

      expect(textInputValue).toEqual("");
      expect(checkboxInputValue).toEqual("");
      expect(hiddenInputValue).toEqual("");
      expect(spanInputValue).toEqual("");
    });

    it("returns the value of the passed input element", function () {
      document.body.innerHTML += `
        <input type="checkbox" value="aTestValue" />
        <input id="hidden-input" type="hidden" />
        <span id="span-input">A span input value</span>
      `;
      const textInput = document.querySelector("#username") as HTMLInputElement;
      textInput.value = "jsmith";
      const checkboxInput = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
      checkboxInput.checked = true;
      const hiddenInput = document.querySelector("#hidden-input") as HTMLInputElement;
      hiddenInput.value = "aHiddenInputValue";
      const spanInput = document.querySelector("#span-input") as HTMLInputElement;

      const textInputValue = autofillCollect["getElementValue"](textInput);
      const checkboxInputValue = autofillCollect["getElementValue"](checkboxInput);
      const hiddenInputValue = autofillCollect["getElementValue"](hiddenInput);
      const spanInputValue = autofillCollect["getElementValue"](spanInput);

      expect(textInputValue).toEqual("jsmith");
      expect(checkboxInputValue).toEqual("✓");
      expect(hiddenInputValue).toEqual("aHiddenInputValue");
      expect(spanInputValue).toEqual("A span input value");
    });

    it("return the truncated value of the passed hidden input type if the value length exceeds 256 characters", function () {
      document.body.innerHTML += `
        <input id="long-value-hidden-input" type="hidden" value="’Twas brillig, and the slithy toves | Did gyre and gimble in the wabe: | All mimsy were the borogoves, | And the mome raths outgrabe. | “Beware the Jabberwock, my son! | The jaws that bite, the claws that catch! | Beware the Jubjub bird, and shun | The frumious Bandersnatch!” | He took his vorpal sword in hand; | Long time the manxome foe he sought— | So rested he by the Tumtum tree | And stood awhile in thought. | And, as in uffish thought he stood, | The Jabberwock, with eyes of flame, | Came whiffling through the tulgey wood, | And burbled as it came! | One, two! One, two! And through and through | The vorpal blade went snicker-snack! | He left it dead, and with its head | He went galumphing back. | “And hast thou slain the Jabberwock? | Come to my arms, my beamish boy! | O frabjous day! Callooh! Callay!” | He chortled in his joy. | ’Twas brillig, and the slithy toves | Did gyre and gimble in the wabe: | All mimsy were the borogoves, | And the mome raths outgrabe." />
      `;
      const longValueHiddenInput = document.querySelector(
        "#long-value-hidden-input"
      ) as HTMLInputElement;

      const longHiddenValue = autofillCollect["getElementValue"](longValueHiddenInput);

      expect(longHiddenValue).toEqual(
        "’Twas brillig, and the slithy toves | Did gyre and gimble in the wabe: | All mimsy were the borogoves, | And the mome raths outgrabe. | “Beware the Jabberwock, my son! | The jaws that bite, the claws that catch! | Beware the Jubjub bird, and shun | The f...SNIPPED"
      );
    });
  });

  describe("getSelectElementOptions", function () {
    it("returns the inner text and values of each `option` within the passed `select`", function () {
      document.body.innerHTML = `
        <select id="select-without-options"></select>
        <select id="select-with-options">
          <option value="1">Option: 1</option>
          <option value="b">Option - B</option>
          <option value="iii">Option III.</option>
          <option value="four"></option>
        </select>
      `;
      const selectWithOptions = document.querySelector("#select-with-options") as HTMLSelectElement;
      const selectWithoutOptions = document.querySelector(
        "#select-without-options"
      ) as HTMLSelectElement;

      const selectWithOptionsOptions =
        autofillCollect["getSelectElementOptions"](selectWithOptions);
      const selectWithoutOptionsOptions =
        autofillCollect["getSelectElementOptions"](selectWithoutOptions);

      expect(selectWithOptionsOptions).toEqual({
        options: [
          ["option1", "1"],
          ["optionb", "b"],
          ["optioniii", "iii"],
          [null, "four"],
        ],
      });
      expect(selectWithoutOptionsOptions).toEqual({ options: [] });
    });
  });

  describe("createAutofillFieldTopLabel", function () {
    it("returns the table column header value for the passed table element", function () {
      document.body.innerHTML = `
        <table>
          <tbody>
            <tr>
              <th>Username</th>
              <th>Password</th>
              <th>Login code</th>
            </tr>
            <tr>
              <td><input type="text" name="username" /></td>
              <td><input type="password" name="password" /></td>
              <td><input type="text" name="auth-code" /></td>
            </tr>
          </tbody>
        </table>
      `;
      const targetTableCellInput = document.querySelector(
        'input[name="password"]'
      ) as HTMLInputElement;

      const targetTableCellLabel =
        autofillCollect["createAutofillFieldTopLabel"](targetTableCellInput);

      expect(targetTableCellLabel).toEqual("Password");
    });

    it("will attempt to return the value for the previous sibling row as the label if a `th` cell is not found", function () {
      document.body.innerHTML = `
        <table>
          <tbody>
            <tr>
              <td>Username</td>
              <td>Password</td>
              <td>Login code</td>
            </tr>
            <tr>
              <td><input type="text" name="username" /></td>
              <td><input type="password" name="password" /></td>
              <td><input type="text" name="auth-code" /></td>
            </tr>
          </tbody>
        </table>
      `;
      const targetTableCellInput = document.querySelector(
        'input[name="auth-code"]'
      ) as HTMLInputElement;

      const targetTableCellLabel =
        autofillCollect["createAutofillFieldTopLabel"](targetTableCellInput);

      expect(targetTableCellLabel).toEqual("Login code");
    });

    it("returns null for the passed table element it's parent row has no previous sibling row", function () {
      document.body.innerHTML = `
        <table>
          <tbody>
            <tr>
              <td><input type="text" name="username" /></td>
              <td><input type="password" name="password" /></td>
              <td><input type="text" name="auth-code" /></td>
            </tr>
          </tbody>
        </table>
      `;
      const targetTableCellInput = document.querySelector(
        'input[name="password"]'
      ) as HTMLInputElement;

      const targetTableCellLabel =
        autofillCollect["createAutofillFieldTopLabel"](targetTableCellInput);

      expect(targetTableCellLabel).toEqual(null);
    });

    it("returns null if the input element is not structured within a `td` element", function () {
      document.body.innerHTML = `
        <table>
          <tbody>
            <tr>
              <td>Username</td>
              <td>Password</td>
              <td>Login code</td>
            </tr>
            <tr>
              <td><input type="text" name="username" /></td>
              <div><input type="password" name="password" /></div>
              <td><input type="text" name="auth-code" /></td>
            </tr>
          </tbody>
        </table>
      `;
      const targetTableCellInput = document.querySelector(
        'input[name="password"]'
      ) as HTMLInputElement;

      const targetTableCellLabel =
        autofillCollect["createAutofillFieldTopLabel"](targetTableCellInput);

      expect(targetTableCellLabel).toEqual(null);
    });

    it("returns null if the index of the `td` element is larger than the length of cells in the sibling row", function () {
      document.body.innerHTML = `
        <table>
          <tbody>
            <tr>
              <td>Username</td>
              <td>Password</td>
            </tr>
            <tr>
              <td><input type="text" name="username" /></td>
              <td><input type="password" name="password" /></td>
              <td><input type="text" name="auth-code" /></td>
            </tr>
          </tbody>
        </table>
      `;
      const targetTableCellInput = document.querySelector(
        'input[name="auth-code"]'
      ) as HTMLInputElement;

      const targetTableCellLabel =
        autofillCollect["createAutofillFieldTopLabel"](targetTableCellInput);

      expect(targetTableCellLabel).toEqual(null);
    });
  });

  describe("isElementHiddenByCss", function () {
    it("returns true when a non-hidden element is passed", function () {
      document.body.innerHTML = `
        <input type="text" name="username" id="username" />
      `;
      const usernameElement = document.getElementById("username") as FormElementWithAttribute;

      const isElementHidden = autofillCollect["isElementHiddenByCss"](usernameElement);

      expect(isElementHidden).toEqual(false);
    });

    it("returns true when the element has a `visibility: hidden;` CSS rule applied to it either inline or in a computed style", function () {
      document.body.innerHTML = `
        <input type="text" name="username" id="username" style="visibility: hidden;" />
        <input type="password" name="password" id="password" />
        <style>
          #password {
            visibility: hidden;
          }
        </style>
      `;
      const usernameElement = document.getElementById("username") as FormElementWithAttribute;
      const passwordElement = document.getElementById("password") as FormElementWithAttribute;
      jest.spyOn(usernameElement.style, "getPropertyValue");
      jest.spyOn(usernameElement.ownerDocument.defaultView, "getComputedStyle");
      jest.spyOn(passwordElement.style, "getPropertyValue");
      jest.spyOn(passwordElement.ownerDocument.defaultView, "getComputedStyle");

      const isUsernameElementHidden = autofillCollect["isElementHiddenByCss"](usernameElement);
      const isPasswordElementHidden = autofillCollect["isElementHiddenByCss"](passwordElement);

      expect(isUsernameElementHidden).toEqual(true);
      expect(usernameElement.style.getPropertyValue).toHaveBeenCalled();
      expect(usernameElement.ownerDocument.defaultView.getComputedStyle).toHaveBeenCalledWith(
        usernameElement
      );
      expect(isPasswordElementHidden).toEqual(true);
      expect(passwordElement.style.getPropertyValue).toHaveBeenCalled();
      expect(passwordElement.ownerDocument.defaultView.getComputedStyle).toHaveBeenCalledWith(
        passwordElement
      );
    });

    it("returns false when the element has a `display: none;` CSS rule applied to it either inline or in a computed style", function () {
      document.body.innerHTML = `
        <input type="text" name="username" id="username" style="display: none;" />
        <input type="password" name="password" id="password" />
        <style>
          #password {
            display: none;
          }
        </style>
      `;
      const usernameElement = document.getElementById("username") as FormElementWithAttribute;
      const passwordElement = document.getElementById("password") as FormElementWithAttribute;

      const isUsernameElementHidden = autofillCollect["isElementHiddenByCss"](usernameElement);
      const isPasswordElementHidden = autofillCollect["isElementHiddenByCss"](passwordElement);

      expect(isUsernameElementHidden).toEqual(true);
      expect(isPasswordElementHidden).toEqual(true);
    });

    it("returns false when the element has a `opacity: 0;` CSS rule applied to it either inline or in a computed style", function () {
      document.body.innerHTML = `
        <input type="text" name="username" id="username" style="opacity: 0;" />
        <input type="password" name="password" id="password" />
        <style>
          #password {
            opacity: 0;
          }
        </style>
      `;
      const usernameElement = document.getElementById("username") as FormElementWithAttribute;
      const passwordElement = document.getElementById("password") as FormElementWithAttribute;

      const isUsernameElementHidden = autofillCollect["isElementHiddenByCss"](usernameElement);
      const isPasswordElementHidden = autofillCollect["isElementHiddenByCss"](passwordElement);

      expect(isUsernameElementHidden).toEqual(true);
      expect(isPasswordElementHidden).toEqual(true);
    });
  });
});
