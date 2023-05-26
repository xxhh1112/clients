import { FillableControl } from "../types";

import AutofillCollect from "./autofill-collect";

describe("AutofillCollect", function () {
  let autofillCollect: any;

  beforeEach(function () {
    jest.clearAllMocks();
    document.body.innerHTML = "";
    autofillCollect = new AutofillCollect();
  });

  describe("getElementLabelTag", function () {
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

      const labelTag = autofillCollect["getElementLabelTag"](element);

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

      const labelTag = autofillCollect["getElementLabelTag"](element);

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

      const labelTag = autofillCollect["getElementLabelTag"](element);

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

      const labelTag = autofillCollect["getElementLabelTag"](element);

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

      const labelTag = autofillCollect["getElementLabelTag"](element);

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

      const labelTag = autofillCollect["getElementLabelTag"](element);

      expect(autofillCollect.createLabelElementsTag).toHaveBeenCalledWith(new Set([elementLabel]));
      expect(labelTag).toEqual("Username");
    });

    it("will return an empty string value if no labels can be found for an element", function () {
      document.body.innerHTML = `
        <input type="text" id="username-id">
      `;
      const element = document.querySelector("#username-id") as FillableControl;

      const labelTag = autofillCollect["getElementLabelTag"](element);

      expect(labelTag).toEqual("");
    });
  });
});
