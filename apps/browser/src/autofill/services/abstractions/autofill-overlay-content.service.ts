import AutofillField from "../../models/autofill-field";
import { ElementWithOpId, FormFieldElement } from "../../types";

interface AutofillOverlayCustomElement extends HTMLElement {
  updateIframeSource(urlPath: string): void;
}

interface AutofillOverlayContentService {
  fieldCurrentlyFocused: boolean;
  setupOverlayIconListenerOnField(
    autofillFieldElement: ElementWithOpId<FormFieldElement>,
    autofillFieldData: AutofillField
  ): void;
  openAutofillOverlayList(): void;
  removeAutofillOverlay(): void;
  removeAutofillOverlayIcon(): void;
  removeAutofillOverlayList(): void;
}

export { AutofillOverlayCustomElement, AutofillOverlayContentService };
