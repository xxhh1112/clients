import AutofillField from "../../models/autofill-field";
import { ElementWithOpId, FormFieldElement } from "../../types";

interface AutofillOverlayCustomElement extends HTMLElement {
  updateIframeSource(urlPath: string): void;
}

interface AutofillOverlayContentService {
  setupOverlayIconListenerOnField(
    autofillFieldElement: ElementWithOpId<FormFieldElement>,
    autofillFieldData: AutofillField
  ): void;
  openAutofillOverlayList(): void;
}

export { AutofillOverlayCustomElement, AutofillOverlayContentService };
