import AutofillField from "../../models/autofill-field";
import { ElementWithOpId, FormFieldElement } from "../../types";

interface AutofillOverlayContentService {
  isFieldCurrentlyFocused: boolean;
  isCurrentlyFilling: boolean;
  setupAutofillOverlayListenerOnField(
    autofillFieldElement: ElementWithOpId<FormFieldElement>,
    autofillFieldData: AutofillField
  ): Promise<void>;
  openAutofillOverlay(focusFieldElement?: boolean, isOpeningFullOverlay?: boolean): void;
  removeAutofillOverlay(): void;
  removeAutofillOverlayButton(): void;
  removeAutofillOverlayList(): void;
  addNewVaultItem(): void;
  redirectOverlayFocusOut(direction: "previous" | "next"): void;
  focusMostRecentOverlayField(): void;
  blurMostRecentOverlayField(): void;
}

export { AutofillOverlayContentService };
