describe("TriggerAutofillScriptInjection", function () {
  beforeEach(function () {
    jest.resetModules();
    jest.clearAllMocks();
    chrome.runtime = {
      sendMessage: jest.fn(),
    } as any;
  });

  describe("init", function () {
    it("sends a message to the extension background", function () {
      require("../content/trigger-autofill-script-injection");

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        command: "triggerAutofillScriptInjection",
      });
    });
  });
});
