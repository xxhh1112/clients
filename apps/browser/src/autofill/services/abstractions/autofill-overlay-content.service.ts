import AutofillField from "../../models/autofill-field";
import { ElementWithOpId, FormFieldElement } from "../../types";

interface AutofillOverlayContentService {
  isFieldCurrentlyFocused: boolean;
  isCurrentlyFilling: boolean;
  setupOverlayIconListenerOnField(
    autofillFieldElement: ElementWithOpId<FormFieldElement>,
    autofillFieldData: AutofillField
  ): void;
  openAutofillOverlay(): void;
  removeAutofillOverlay(): void;
  removeAutofillOverlayIcon(): void;
  removeAutofillOverlayList(): void;
  updateAutofillOverlayListHeight(message: any): void;
  addNewVaultItem(): void;
}

export { AutofillOverlayContentService };
