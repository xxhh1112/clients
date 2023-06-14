import DomElementVisibilityService from "./dom-element-visibility.service";

describe("DomElementVisibilityService", function () {
  let domElementVisibilityService: DomElementVisibilityService;

  beforeEach(function () {
    jest.clearAllMocks();
    document.body.innerHTML = `
      <form id="root">
        <label for="username">Username</label>
        <input type="text" name="username">
        <label for="password">Password</label>
        <input type="password" name="password">
      </form>
    `;
    domElementVisibilityService = new DomElementVisibilityService();
  });

  // describe("isFormFieldViewable", function () {});

  describe("isElementHiddenByCss", function () {
    it("returns true when a non-hidden element is passed", function () {
      document.body.innerHTML = `
        <input type="text" name="username" id="username" />
      `;
      const usernameElement = document.getElementById("username");

      const isElementHidden = domElementVisibilityService["isElementHiddenByCss"](usernameElement);

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
      const usernameElement = document.getElementById("username");
      const passwordElement = document.getElementById("password");
      jest.spyOn(usernameElement.style, "getPropertyValue");
      jest.spyOn(usernameElement.ownerDocument.defaultView, "getComputedStyle");
      jest.spyOn(passwordElement.style, "getPropertyValue");
      jest.spyOn(passwordElement.ownerDocument.defaultView, "getComputedStyle");

      const isUsernameElementHidden =
        domElementVisibilityService["isElementHiddenByCss"](usernameElement);
      const isPasswordElementHidden =
        domElementVisibilityService["isElementHiddenByCss"](passwordElement);

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

    it("returns true when the element has a `display: none;` CSS rule applied to it either inline or in a computed style", function () {
      document.body.innerHTML = `
        <input type="text" name="username" id="username" style="display: none;" />
        <input type="password" name="password" id="password" />
        <style>
          #password {
            display: none;
          }
        </style>
      `;
      const usernameElement = document.getElementById("username");
      const passwordElement = document.getElementById("password");

      const isUsernameElementHidden =
        domElementVisibilityService["isElementHiddenByCss"](usernameElement);
      const isPasswordElementHidden =
        domElementVisibilityService["isElementHiddenByCss"](passwordElement);

      expect(isUsernameElementHidden).toEqual(true);
      expect(isPasswordElementHidden).toEqual(true);
    });

    it("returns true when the element has a `opacity: 0;` CSS rule applied to it either inline or in a computed style", function () {
      document.body.innerHTML = `
        <input type="text" name="username" id="username" style="opacity: 0;" />
        <input type="password" name="password" id="password" />
        <style>
          #password {
            opacity: 0;
          }
        </style>
      `;
      const usernameElement = document.getElementById("username");
      const passwordElement = document.getElementById("password");

      const isUsernameElementHidden =
        domElementVisibilityService["isElementHiddenByCss"](usernameElement);
      const isPasswordElementHidden =
        domElementVisibilityService["isElementHiddenByCss"](passwordElement);

      expect(isUsernameElementHidden).toEqual(true);
      expect(isPasswordElementHidden).toEqual(true);
    });

    it("returns true when the element has a `clip-path` CSS rule applied to it that hides the element either inline or in a computed style", function () {
      document.body.innerHTML = `
        <input type="text" name="username" id="username" style="clip-path: inset(50%);" />
        <input type="password" name="password" id="password" />
        <input type="text" >
        <style>
          #password {
            clip-path: inset(100%);
          }
        </style>
      `;
    });
  });
});
