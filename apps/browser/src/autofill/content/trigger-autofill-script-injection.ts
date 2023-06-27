import { TriggerAutofillScriptInjection as TriggerAutofillScriptInjectionInterface } from "./abstractions/trigger-autofill-script-injection";

class TriggerAutofillScriptInjection implements TriggerAutofillScriptInjectionInterface {
  init() {
    chrome.runtime.sendMessage({ command: "triggerAutofillScriptInjection" });
  }
}

(function () {
  if (!window.bitwardenTriggerAutofillScriptInjection) {
    window.bitwardenTriggerAutofillScriptInjection = new TriggerAutofillScriptInjection();
    window.bitwardenTriggerAutofillScriptInjection.init();
  }
})();
