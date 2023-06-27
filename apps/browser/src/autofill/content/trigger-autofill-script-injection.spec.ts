import { TriggerAutofillScriptInjection } from "./abstractions/trigger-autofill-script-injection";

describe("TriggerAutofillScriptInjection", function () {
  let bitwardenTriggerAutofillScriptInjection: TriggerAutofillScriptInjection;

  beforeEach(function () {
    jest.resetModules();
    jest.clearAllMocks();
    require("../content/trigger-autofill-script-injection");
    bitwardenTriggerAutofillScriptInjection = window.bitwardenTriggerAutofillScriptInjection;
    chrome.runtime = {
      sendMessage: jest.fn(),
    } as any;
  });

  describe("init", function () {
    it("sends a message to the extension background", function () {
      bitwardenTriggerAutofillScriptInjection.init();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        command: "triggerAutofillScriptInjection",
      });
    });
  });
});
