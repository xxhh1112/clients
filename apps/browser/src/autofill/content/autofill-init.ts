import {
  AutofillExtensionMessage,
  AutofillExtensionMessageHandlers,
  AutofillInit as AutofillInitInterface,
} from "../models/autofill-init";
import AutofillPageDetails from "../models/autofill-page-details";

import AutofillCollect from "./autofill-collect";
import AutofillInsert from "./autofill-insert";

class AutofillInit implements AutofillInitInterface {
  private autofillCollect: AutofillCollect;
  private autofillInsert: AutofillInsert;
  private readonly extensionMessageHandlers: AutofillExtensionMessageHandlers = {
    collectPageDetails: ({ message }) => this.collectPageDetails(message),
    collectPageDetailsImmediately: ({ message }) => this.collectPageDetails(message, true),
    fillForm: ({ message }) => this.autofillInsert.fillForm(message.fillScript),
  };

  /**
   * AutofillInit constructor. Initializes the
   * AutofillCollect and AutofillInsert classes.
   */
  constructor() {
    this.autofillCollect = new AutofillCollect();
    this.autofillInsert = new AutofillInsert();
  }

  /**
   * Initializes the autofill content script, setting up
   * the extension message listeners. This method should
   * be called once when the content script is loaded.
   * @public
   */
  init() {
    this.setupExtensionMessageListeners();
  }

  /**
   * Collects the page details and sends them to the
   * extension background script. If the `sendDetailsInResponse`
   * parameter is set to true, the page details will be
   * returned to facilitate sending the details in the
   * response to the extension message.
   * @param {AutofillExtensionMessage} message
   * @param {boolean} sendDetailsInResponse
   * @returns {AutofillPageDetails | void}
   * @private
   */
  private collectPageDetails(
    message: AutofillExtensionMessage,
    sendDetailsInResponse = false
  ): AutofillPageDetails | void {
    const pageDetails: AutofillPageDetails = this.autofillCollect.getPageDetails();
    if (sendDetailsInResponse) {
      return pageDetails;
    }

    chrome.runtime.sendMessage({
      command: "collectPageDetailsResponse",
      tab: message.tab,
      details: pageDetails,
      sender: message.sender,
    });
  }

  /**
   * Sets up the extension message listeners
   * for the content script.
   * @private
   */
  private setupExtensionMessageListeners() {
    chrome.runtime.onMessage.addListener(this.handleExtensionMessage);
  }

  /**
   * Handles the extension messages
   * sent to the content script.
   * @param {AutofillExtensionMessage} message
   * @param {chrome.runtime.MessageSender} sender
   * @param {(response?: any) => void} sendResponse
   * @returns {boolean}
   * @private
   */
  private handleExtensionMessage = (
    message: AutofillExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): boolean => {
    const command: string = message.command;
    const handler: CallableFunction | undefined = this.extensionMessageHandlers[command];
    if (!handler) {
      return false;
    }

    const messageResponse = handler({ message, sender });
    if (!messageResponse) {
      return false;
    }

    Promise.resolve(messageResponse).then((response) => sendResponse(response));
    return true;
  };
}

(function () {
  window.bitwardenAutofillInit = new AutofillInit();
  window.bitwardenAutofillInit.init();
})();
