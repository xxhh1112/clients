import AutofillFieldVisibilityService from "../services/autofill-field-visibility.service";
import CollectAutofillContentService from "../services/collect-autofill-content.service";

import AutofillInsert from "./autofill-insert";

describe("AutofillInsert", function () {
  const autofillFieldVisibilityService = new AutofillFieldVisibilityService();
  const collectAutofillContentService = new CollectAutofillContentService(
    autofillFieldVisibilityService
  );
  let autofillInsert: AutofillInsert;

  beforeEach(() => {
    autofillInsert = new AutofillInsert(
      autofillFieldVisibilityService,
      collectAutofillContentService
    );
  });

  describe("fillForm", () => {
    it("will pass a placeholder test", function () {
      autofillInsert.fillForm({} as any);

      expect(true).toBe(true);
    });
  });
});
