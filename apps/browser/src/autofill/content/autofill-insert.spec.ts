import AutofillFieldVisibilityService from "../services/autofill-field-visibility.service";

import AutofillCollect from "./autofill-collect";
import AutofillInsert from "./autofill-insert";

describe("AutofillInsert", function () {
  const autofillFieldVisibility = new AutofillFieldVisibilityService();
  const autofillCollect = new AutofillCollect(autofillFieldVisibility);
  let autofillInsert: AutofillInsert;

  beforeEach(() => {
    autofillInsert = new AutofillInsert(autofillFieldVisibility, autofillCollect);
  });

  describe("fillForm", () => {
    it("will pass a placeholder test", function () {
      autofillInsert.fillForm({} as any);

      expect(true).toBe(true);
    });
  });
});
