import AutofillInit from "./autofill-init";

(function () {
  if (!window.bitwardenAutofillInit) {
    window.bitwardenAutofillInit = new AutofillInit();
    window.bitwardenAutofillInit.init();
  }
})();
