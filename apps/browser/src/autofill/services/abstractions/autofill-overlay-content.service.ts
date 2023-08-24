import AutofillField from "../../models/autofill-field";
import { ElementWithOpId, FormFieldElement } from "../../types";

interface AutofillOverlayContentService {
  isFieldCurrentlyFocused: boolean;
  isCurrentlyFilling: boolean;
  setupAutofillOverlayListenerOnField(
    autofillFieldElement: ElementWithOpId<FormFieldElement>,
    autofillFieldData: AutofillField
  ): void;
  openAutofillOverlay(): void;
  removeAutofillOverlay(): void;
  removeAutofillOverlayButton(): void;
  removeAutofillOverlayList(): void;
  updateAutofillOverlayListHeight(message: any): void;
  addNewVaultItem(): void;
  redirectOverlayFocusOut(direction: "previous" | "next"): void;
  focusMostRecentOverlayField(): void;
}

export { AutofillOverlayContentService };
