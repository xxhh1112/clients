import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import AutofillField from "../../models/autofill-field";
import { ElementWithOpId, FormFieldElement } from "../../types";

interface AutofillOverlayContentService {
  isFieldCurrentlyFocused: boolean;
  isCurrentlyFilling: boolean;
  setupAutofillOverlayListenerOnField(
    autofillFieldElement: ElementWithOpId<FormFieldElement>,
    autofillFieldData: AutofillField
  ): void;
  setIsOverlayCiphersPopulated(isOverlayCiphersPopulated: boolean): void;
  openAutofillOverlay(isFocusingFieldElement?: boolean, authStatus?: AuthenticationStatus): void;
  removeAutofillOverlay(): void;
  removeAutofillOverlayButton(): void;
  removeAutofillOverlayList(): void;
  addNewVaultItem(): void;
  redirectOverlayFocusOut(direction: "previous" | "next"): void;
  focusMostRecentOverlayField(): void;
  blurMostRecentOverlayField(): void;
}

export { AutofillOverlayContentService };
