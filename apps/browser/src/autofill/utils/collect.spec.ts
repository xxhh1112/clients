import { FormElementWithAttribute } from "../types";

import {
  canSeeElementToStyle,
  getElementByOpId,
  isElementVisible,
  isNewSectionTag,
  selectAllFromDoc,
  getFormElements,
  getAdjacentElementLabelValues,
  getPropertyOrAttribute,
  getElementValue,
  getSelectElementOptions,
  getLabelTop,
  queryDocument,
} from "./collect";

const mockLoginForm = `
  <div id="root">
    <form>
      <input type="text" id="username" />
      <input type="password" />
    </form>
  </div>
`;

let consoleSpy: jest.SpyInstance<any>;
document.body.innerHTML = mockLoginForm;

describe("collect utils", () => {
  afterEach(() => {
    document.body.innerHTML = mockLoginForm;
  });

  describe("isNewSectionTag", () => {
    const validTags = [
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

    const invalidTags = ["div", "span"];

    validTags.forEach((tag) => {
      const element = document.createElement(tag);

      it(`should return true if the element tag is a ${tag}`, () => {
        expect(isNewSectionTag(element)).toEqual(true);
      });
    });

    invalidTags.forEach((tag) => {
      const element = document.createElement(tag);

      it(`should return false if the element tag is a ${tag}`, () => {
        expect(isNewSectionTag(element)).toEqual(false);
      });
    });

    it(`should return true if the element tag is falsy`, () => {
      expect(isNewSectionTag(undefined)).toEqual(true);
    });
  });

  describe("isElementVisible", () => {
    it("should return true when a non-hidden element is passed", () => {
      const testElement = document.querySelector(
        'input[type="password"]'
      ) as FormElementWithAttribute;

      expect(isElementVisible(testElement)).toEqual(true);
    });

    it("should return false when the element has a `visibility: hidden;` CSS rule applied to it", () => {
      const testElement = document.querySelector(
        'input[type="password"]'
      ) as FormElementWithAttribute;
      testElement.style.visibility = "hidden";

      expect(isElementVisible(testElement)).toEqual(false);
    });

    it("should return false when the element has a `display: none;` CSS rule applied to it", () => {
      const testElement = document.querySelector(
        'input[type="password"]'
      ) as FormElementWithAttribute;
      testElement.style.display = "none";

      expect(isElementVisible(testElement)).toEqual(false);
    });

    it("should return false when a parent of the element has a `display: none;` or `visibility: hidden;` CSS rule applied to it", () => {
      document.body.innerHTML =
        mockLoginForm + '<div style="visibility: hidden;"><input type="email" /></div>';
      let testElement = document.querySelector('input[type="email"]') as FormElementWithAttribute;

      expect(isElementVisible(testElement)).toEqual(false);

      document.body.innerHTML =
        mockLoginForm +
        `
          <div style="display: none;">
            <div>
              <span id="input-tag"></span>
            </div>
          </div>
        `;
      testElement = document.querySelector("#input-tag") as FormElementWithAttribute;
      expect(isElementVisible(testElement)).toEqual(false);
    });
  });

  describe("canSeeElementToStyle", () => {
    it("should return true when the element is a non-hidden password field", () => {
      const testElement = document.querySelector(
        'input[type="password"]'
      ) as FormElementWithAttribute;

      expect(canSeeElementToStyle(testElement, true)).toEqual(true);
    });

    it("should return true when the element is a non-hidden email input", () => {
      document.body.innerHTML = mockLoginForm + '<input type="email" />';
      const testElement = document.querySelector('input[type="email"]') as FormElementWithAttribute;

      expect(canSeeElementToStyle(testElement, true)).toEqual(true);
    });

    it("should return true when the element is a non-hidden text input", () => {
      document.body.innerHTML = mockLoginForm + '<input type="text" />';
      const testElement = document.querySelector('input[type="text"]') as FormElementWithAttribute;

      expect(canSeeElementToStyle(testElement, true)).toEqual(true);
    });

    it("should return true when the element is a non-hidden number input", () => {
      document.body.innerHTML = mockLoginForm + '<input type="number" />';
      const testElement = document.querySelector(
        'input[type="number"]'
      ) as FormElementWithAttribute;

      expect(canSeeElementToStyle(testElement, true)).toEqual(true);
    });

    it("should return true when the element is a non-hidden tel input", () => {
      document.body.innerHTML = mockLoginForm + '<input type="tel" />';
      const testElement = document.querySelector('input[type="tel"]') as FormElementWithAttribute;

      expect(canSeeElementToStyle(testElement, true)).toEqual(true);
    });

    it("should return true when the element is a non-hidden url input", () => {
      document.body.innerHTML = mockLoginForm + '<input type="url" />';
      const testElement = document.querySelector('input[type="url"]') as FormElementWithAttribute;

      expect(canSeeElementToStyle(testElement, true)).toEqual(true);
    });

    it("should return false when the element is a non-hidden hidden input type", () => {
      document.body.innerHTML = mockLoginForm + '<input type="hidden" />';
      const testElement = document.querySelector(
        'input[type="hidden"]'
      ) as FormElementWithAttribute;

      expect(canSeeElementToStyle(testElement, true)).toEqual(false);
    });

    it("should return false when the element is a non-hidden textarea", () => {
      document.body.innerHTML = mockLoginForm + "<textarea></textarea>";
      const testElement = document.querySelector("textarea") as FormElementWithAttribute;

      expect(canSeeElementToStyle(testElement, true)).toEqual(false);
    });

    it("should return true when the element is a non-hidden span", () => {
      document.body.innerHTML = mockLoginForm + '<span id="input-tag"></span>';
      const testElement = document.querySelector("#input-tag") as FormElementWithAttribute;

      expect(canSeeElementToStyle(testElement, true)).toEqual(true);
    });

    it("should return false when the element is a unsupported tag", () => {
      document.body.innerHTML = mockLoginForm + '<div id="input-tag"></div>';
      const testElement = document.querySelector("#input-tag") as FormElementWithAttribute;

      expect(canSeeElementToStyle(testElement, true)).toEqual(false);
    });

    it("should return false when the element has a `visibility: hidden;` CSS rule applied to it", () => {
      const testElement = document.querySelector(
        'input[type="password"]'
      ) as FormElementWithAttribute;
      testElement.style.visibility = "hidden";

      expect(canSeeElementToStyle(testElement, true)).toEqual(false);
    });

    it("should return false when the element has a `display: none;` CSS rule applied to it", () => {
      const testElement = document.querySelector(
        'input[type="password"]'
      ) as FormElementWithAttribute;
      testElement.style.display = "none";

      expect(canSeeElementToStyle(testElement, true)).toEqual(false);
    });

    it("should return false when a parent of the element has a `display: none;` or `visibility: hidden;` CSS rule applied to it", () => {
      document.body.innerHTML =
        mockLoginForm + '<div style="visibility: hidden;"><input type="email" /></div>';
      let testElement = document.querySelector('input[type="email"]') as FormElementWithAttribute;

      expect(canSeeElementToStyle(testElement, true)).toEqual(false);

      document.body.innerHTML =
        mockLoginForm +
        `
          <div style="display: none;">
            <div>
              <span id="input-tag"></span>
            </div>
          </div>
        `;
      testElement = document.querySelector("#input-tag") as FormElementWithAttribute;
      expect(canSeeElementToStyle(testElement, true)).toEqual(false);
    });
  });

  describe("selectAllFromDoc", () => {
    it("should return an array of all elements in the document which the selector targets", () => {
      let selection = selectAllFromDoc("input");

      expect(selection.length).toEqual(2);

      selection = selectAllFromDoc("p");

      expect(selection.length).toEqual(0);
    });
  });

  describe("getElementByOpId", () => {
    it("should return the element with the opid property value matching the passed value", () => {
      const textInput = document.querySelector('input[type="text"]') as FormElementWithAttribute;
      const passwordInput = document.querySelector(
        'input[type="password"]'
      ) as FormElementWithAttribute;

      textInput.setAttribute("opid", "__0");
      passwordInput.setAttribute("opid", "__1");

      expect(getElementByOpId("__0")).toEqual(textInput);
      expect(getElementByOpId("__0")).not.toEqual(passwordInput);
      expect(getElementByOpId("__1")).toEqual(passwordInput);
    });

    describe("should handle multiple elements with the same `opid` property value matching the passed value", () => {
      beforeAll(() => {
        consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {
          /* no-op */
        });
      });

      afterAll(() => {
        consoleSpy.mockRestore();
      });

      it("should return the first of the elements with an `opid` value matching the passed value and emit a console warning", () => {
        const textInput = document.querySelector('input[type="text"]') as FormElementWithAttribute;
        const passwordInput = document.querySelector(
          'input[type="password"]'
        ) as FormElementWithAttribute;

        textInput.opid = "__1";
        passwordInput.opid = "__1";

        expect(getElementByOpId("__1")).toEqual(textInput);
        expect(getElementByOpId("__1")).not.toEqual(passwordInput);
        expect(getElementByOpId("__0")).toEqual(textInput);
        expect(consoleSpy.mock.calls[0]?.[0]).toEqual("More than one element found with opid __1");
      });
    });

    it("should return the element at the index position (parsed from passed opid) of all document input, select, button, textarea, or span[data-bwautofill] elements when the passed opid value cannot be found", () => {
      const textInput = document.querySelector('input[type="text"]') as FormElementWithAttribute;
      const passwordInput = document.querySelector(
        'input[type="password"]'
      ) as FormElementWithAttribute;

      textInput.removeAttribute("opid");
      passwordInput.opid = "__1";

      expect(textInput.hasAttribute("opid")).toEqual(false);
      expect(getElementByOpId("__0")).toEqual(textInput);
      expect(getElementByOpId("__0")).not.toEqual(passwordInput);
      expect(getElementByOpId("__2")).toEqual(null);
    });

    it("should return null if a falsy value is passed", () => {
      expect(getElementByOpId(null)).toEqual(null);
      expect(getElementByOpId(undefined)).toEqual(null);
    });

    it("should return null if no suitable element could be found", () => {
      document.body.innerHTML = "<div></div>";

      expect(getElementByOpId("__2")).toEqual(null);
    });
  });

  describe("getAdjacentElementLabelValues", () => {
    it("should find text adjacent to the target element likely to be a label", () => {
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
      const elementList: string[] = [];

      getAdjacentElementLabelValues(textInput, elementList);

      expect(elementList).toEqual([
        "something else",
        "Not visible text",
        "Other things which are also stuff",
        "Stuff Section Header",
      ]);
    });

    it("should stop looking at siblings for label values when a 'new section' element is seen", () => {
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
      const elementList: string[] = [];

      getAdjacentElementLabelValues(textInput, elementList);

      expect(elementList).toEqual(["something else"]);
    });

    it("should keep looking for labels in parents when there are no siblings of the target element", () => {
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
      const elementList: string[] = [];

      getAdjacentElementLabelValues(textInput, elementList);

      expect(elementList).toEqual(["some things"]);
    });

    // @TODO This case should probably not care about whitespace/text nodes along the way, but the code path currently does
    it("should find label in parent sibling last child if no other label candidates have been encountered and there are no text nodes along the way", () => {
      document.body.innerHTML = `
        <div><div><div>not the most relevant things</div><div>some nested things</div><div><input id="input-tag" type="text" value="something" /></div></div>
      `;

      const textInput = document.querySelector("#input-tag") as FormElementWithAttribute;
      const elementList: string[] = [];

      getAdjacentElementLabelValues(textInput, elementList);

      expect(elementList).toEqual(["some nested things"]);
    });

    it("should exit early if the target element has no parent element/node", () => {
      const textInput = document.querySelector("html") as HTMLHtmlElement;
      const elementList: string[] = [];

      getAdjacentElementLabelValues(textInput, elementList);

      expect(elementList).toEqual([]);
    });
  });

  describe("getFormElements", () => {
    it("should return all form elements from the targeted document", () => {
      const formElements = getFormElements(document);
      const elementStringsToCheck = formElements.map(({ outerHTML }) => outerHTML);

      expect(elementStringsToCheck).toEqual([
        '<input type="text" id="username">',
        '<input type="password">',
      ]);
    });

    it("should return up to 2 (passed as `limit`) form elements from the targeted document with more than 2 form elements", () => {
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

      const formElements = getFormElements(document, 2);
      const elementStringsToCheck = formElements.map(({ outerHTML }) => outerHTML);

      expect(elementStringsToCheck).toEqual([
        '<span data-bwautofill="true">included span</span>',
        '<textarea name="user-bio" rows="10" cols="42">Tell us about yourself...</textarea>',
      ]);
    });

    it("should return form elements from the targeted document, ignoring input types `hidden`, `submit`, `reset`, `button`, `image`, `file`, and inputs tagged with `data-bwignore`, while giving lower order priority to `checkbox` and `radio` inputs if the returned list is truncated by `limit`", () => {
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

      const formElements = getFormElements(document);
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

    it("should return form elements from the targeted document while giving lower order priority to `checkbox` and `radio` inputs if the returned list is truncated by `limit`", () => {
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

      const truncatedFormElements = getFormElements(document, 8);
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

  describe("getPropertyOrAttribute", () => {
    it("should get the value of the named property or attribute of the target element, if the value is a string", () => {
      document.body.innerHTML += '<input type="checkbox" value="userWouldLikeToCheck" checked />';

      const textInput = document.querySelector("#username") as HTMLInputElement;
      textInput.setAttribute("value", "jsmith");
      const checkboxInput = document.querySelector('input[type="checkbox"]') as HTMLInputElement;

      expect(getPropertyOrAttribute(textInput, "value")).toEqual("jsmith");
      expect(getPropertyOrAttribute(textInput, "id")).toEqual("username");
      expect(getPropertyOrAttribute(textInput, "baseURI")).toEqual("http://localhost/");
      expect(getPropertyOrAttribute(textInput, "autofocus")).toEqual(null);
      expect(getPropertyOrAttribute(textInput, "non-existant-attribute")).toEqual(null);
      expect(getPropertyOrAttribute(checkboxInput, "checked")).toEqual("");
    });
  });

  describe("getElementValue", () => {
    it("should return the value of the passed input element", () => {
      // @TODO cannot test `span` `innerText` case, as jsdom has no layout engine
      document.body.innerHTML += `
        <input type="checkbox" value="aTestValue" />
        <input id="hidden-input" type="hidden" />
        <span id="span-input">A span input value</span>
      `;

      const textInput = document.querySelector("#username") as HTMLInputElement;
      const checkboxInput = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
      const hiddenInput = document.querySelector("#hidden-input") as HTMLInputElement;

      expect(getElementValue(textInput)).toEqual("");
      expect(getElementValue(checkboxInput)).toEqual("");
      expect(getElementValue(hiddenInput)).toEqual("");

      textInput.value = "jsmith";
      checkboxInput.checked = true;
      hiddenInput.value = "aHiddenInputValue";

      expect(getElementValue(textInput)).toEqual("jsmith");
      expect(getElementValue(checkboxInput)).toEqual("✓");
      expect(getElementValue(hiddenInput)).toEqual("aHiddenInputValue");
    });

    it("should return the truncated value of the passed hidden input type if the value length exceeds 256 characters", () => {
      document.body.innerHTML += `
        <input id="long-value-hidden-input" type="hidden" value="’Twas brillig, and the slithy toves | Did gyre and gimble in the wabe: | All mimsy were the borogoves, | And the mome raths outgrabe. | “Beware the Jabberwock, my son! | The jaws that bite, the claws that catch! | Beware the Jubjub bird, and shun | The frumious Bandersnatch!” | He took his vorpal sword in hand; | Long time the manxome foe he sought— | So rested he by the Tumtum tree | And stood awhile in thought. | And, as in uffish thought he stood, | The Jabberwock, with eyes of flame, | Came whiffling through the tulgey wood, | And burbled as it came! | One, two! One, two! And through and through | The vorpal blade went snicker-snack! | He left it dead, and with its head | He went galumphing back. | “And hast thou slain the Jabberwock? | Come to my arms, my beamish boy! | O frabjous day! Callooh! Callay!” | He chortled in his joy. | ’Twas brillig, and the slithy toves | Did gyre and gimble in the wabe: | All mimsy were the borogoves, | And the mome raths outgrabe." />
      `;

      const longValueHiddenInput = document.querySelector(
        "#long-value-hidden-input"
      ) as HTMLInputElement;

      expect(getElementValue(longValueHiddenInput)).toEqual(
        "’Twas brillig, and the slithy toves | Did gyre and gimble in the wabe: | All mimsy were the borogoves, | And the mome raths outgrabe. | “Beware the Jabberwock, my son! | The jaws that bite, the claws that catch! | Beware the Jubjub bird, and shun | The f...SNIPPED"
      );
    });
  });

  describe("getSelectElementOptions", () => {
    it("should return the inner text and values of each `option` within the passed `select`", () => {
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

      expect(getSelectElementOptions(selectWithOptions)).toEqual({
        options: [
          ["option1", "1"],
          ["optionb", "b"],
          ["optioniii", "iii"],
          [null, "four"],
        ],
      });
      expect(getSelectElementOptions(selectWithoutOptions)).toEqual({
        options: [],
      });
    });
  });

  describe("getLabelTop", () => {
    it("should return the table column header value for the passed table element", () => {
      document.body.innerHTML = `
        <table>
          <tbody>
            <tr>
              <th>Username</td>
              <th>Password</td>
              <th>Login code</th>
            </tr>
            <tr>
              <td><input type="text" name="username" /></td>
              <td><input type="password" name="password" /><td>
              <td><input type="text" name="auth-code" /><td>
            </tr>
          </tbody>
        </table>
      `;

      const targetTableCellInput = document.querySelector(
        'input[name="password"]'
      ) as HTMLSelectElement;

      expect(getLabelTop(targetTableCellInput)).toEqual("Password");
    });

    it("should return null for the passed table element it's parent row has no previous sibling row", () => {
      document.body.innerHTML = `
        <table>
          <tbody>
            <tr>
              <td><input type="text" name="username" /></td>
              <td><input type="password" name="password" /><td>
              <td><input type="text" name="auth-code" /><td>
            </tr>
          </tbody>
        </table>
      `;

      const targetTableCellInput = document.querySelector(
        'input[name="password"]'
      ) as HTMLSelectElement;

      expect(getLabelTop(targetTableCellInput)).toEqual(null);
    });
  });

  // @TODO jsdom has no layout engine, making testing `isElementViewable` with it non-authoritative
  // describe("isElementViewable", () => {
  //   it("should return true if the passed element is visible in the viewport", () => {
  //   });

  //   it("should return false if the passed element is not visible in the viewport", () => {
  //   });
  // });

  describe("queryDoc", () => {
    it("should return a list of queried elements", () => {
      const documentBodyRootElements = queryDocument(document, "body input");
      const truncatedDocumentBodyElements = documentBodyRootElements.map(
        ({ outerHTML }) => outerHTML
      );

      expect(truncatedDocumentBodyElements).toEqual([
        '<input type="text" id="username">',
        '<input type="password">',
      ]);
    });
  });
});
