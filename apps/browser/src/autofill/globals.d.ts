import { AutofillInit } from "./content/abstractions/autofill-init";
import { TriggerAutofillScriptInjection } from "./content/abstractions/trigger-autofill-script-injection";

declare global {
  interface Window {
    bitwardenAutofillInit?: AutofillInit;
    bitwardenTriggerAutofillScriptInjection?: TriggerAutofillScriptInjection;
  }
}
