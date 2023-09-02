import AutofillOverlayContentService from "../services/autofill-overlay-content.service";

import AutofillInit from "./autofill-init";

(function () {
  if (!window.bitwardenAutofillInit) {
    const autofillOverlayContentService = new AutofillOverlayContentService();
    window.bitwardenAutofillInit = new AutofillInit(autofillOverlayContentService);
    window.bitwardenAutofillInit.init();
  }
})();
