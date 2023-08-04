import AutofillField from "../../models/autofill-field";
import { ElementWithOpId, FormFieldElement } from "../../types";

interface AutofillOverlayContentService {
  fieldCurrentlyFocused: boolean;
  setupOverlayIconListenerOnField(
    autofillFieldElement: ElementWithOpId<FormFieldElement>,
    autofillFieldData: AutofillField
  ): void;
  openAutofillOverlay(): void;
  removeAutofillOverlay(): void;
  removeAutofillOverlayIcon(): void;
  removeAutofillOverlayList(): void;
}

export { AutofillOverlayContentService };
