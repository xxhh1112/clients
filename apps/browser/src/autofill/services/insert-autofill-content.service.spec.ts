import AutofillFieldVisibilityService from "./autofill-field-visibility.service";
import CollectAutofillContentService from "./collect-autofill-content.service";
import InsertAutofillContentService from "./insert-autofill-content.service";

describe("InsertAutofillContentService", function () {
  const autofillFieldVisibilityService = new AutofillFieldVisibilityService();
  const collectAutofillContentService = new CollectAutofillContentService(
    autofillFieldVisibilityService
  );
  let autofillInsert: InsertAutofillContentService;

  beforeEach(() => {
    autofillInsert = new InsertAutofillContentService(
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
