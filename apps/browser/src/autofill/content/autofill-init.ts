import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import AutofillPageDetails from "../models/autofill-page-details";
import AutofillScript from "../models/autofill-script";
import AutofillOverlayContentService from "../services/autofill-overlay-content.service";
import CollectAutofillContentService from "../services/collect-autofill-content.service";
import DomElementVisibilityService from "../services/dom-element-visibility.service";
import InsertAutofillContentService from "../services/insert-autofill-content.service";

import {
  AutofillExtensionMessage,
  AutofillExtensionMessageHandlers,
  AutofillInit as AutofillInitInterface,
} from "./abstractions/autofill-init";

class AutofillInit implements AutofillInitInterface {
  private readonly domElementVisibilityService: DomElementVisibilityService;
  private readonly autofillOverlayContentService: AutofillOverlayContentService;
  private readonly collectAutofillContentService: CollectAutofillContentService;
  private readonly insertAutofillContentService: InsertAutofillContentService;
  private readonly extensionMessageHandlers: AutofillExtensionMessageHandlers = {
    collectPageDetails: ({ message }) => this.collectPageDetails(message),
    collectPageDetailsImmediately: ({ message }) => this.collectPageDetails(message, true),
    fillForm: ({ message }) => this.fillForm(message.fillScript),
    openAutofillOverlayList: ({ message }) =>
      this.openAutofillOverlayList(message.authStatus, message.focusFieldElement),
    closeAutofillOverlay: () => this.removeAutofillOverlay(),
    updateAutofillOverlayListHeight: ({ message }) => this.updateAutofillOverlayListHeight(message),
    addNewVaultItemFromOverlay: () => this.addNewVaultItemFromOverlay(),
    redirectOverlayFocusOut: ({ message }) => this.redirectOverlayFocusOut(message),
  };

  /**
   * AutofillInit constructor. Initializes the DomElementVisibilityService,
   * CollectAutofillContentService and InsertAutofillContentService classes.
   */
  constructor() {
    this.domElementVisibilityService = new DomElementVisibilityService();
    this.autofillOverlayContentService = new AutofillOverlayContentService();
    this.collectAutofillContentService = new CollectAutofillContentService(
      this.domElementVisibilityService,
      this.autofillOverlayContentService
    );
    this.insertAutofillContentService = new InsertAutofillContentService(
      this.domElementVisibilityService,
      this.collectAutofillContentService
    );
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
  private async collectPageDetails(
    message: AutofillExtensionMessage,
    sendDetailsInResponse = false
  ): Promise<AutofillPageDetails | void> {
    const pageDetails: AutofillPageDetails =
      await this.collectAutofillContentService.getPageDetails();
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
   * Fills the form with the given fill script.
   * @param {AutofillScript} fillScript
   * @private
   */
  private fillForm(fillScript: AutofillScript) {
    this.autofillOverlayContentService.isCurrentlyFilling = true;
    this.insertAutofillContentService.fillForm(fillScript);

    // TODO: CG - This ensures that we do not show the autofill overlay as we focus and fill pages. Need to consider if there is a better way to do this.
    // Equally, I'm not sure if we really want to focus the most recent field. This could provide problems when not filling with the overlay. Need to account for that.
    setTimeout(() => {
      this.autofillOverlayContentService.isCurrentlyFilling = false;
      this.autofillOverlayContentService.focusMostRecentOverlayField();
    }, 500);
  }

  private openAutofillOverlayList(authStatus: AuthenticationStatus, focusFieldElement: boolean) {
    this.autofillOverlayContentService.openAutofillOverlay(authStatus, focusFieldElement);
  }

  private removeAutofillOverlay() {
    if (this.autofillOverlayContentService.isFieldCurrentlyFocused) {
      return;
    }

    if (this.autofillOverlayContentService.isCurrentlyFilling) {
      this.autofillOverlayContentService.removeAutofillOverlayList();
      return;
    }

    this.autofillOverlayContentService.removeAutofillOverlay();
  }

  private updateAutofillOverlayListHeight(message: any) {
    this.autofillOverlayContentService.updateAutofillOverlayListHeight(message);
  }

  private addNewVaultItemFromOverlay() {
    this.autofillOverlayContentService.addNewVaultItem();
  }

  private redirectOverlayFocusOut(message: any) {
    this.autofillOverlayContentService.redirectOverlayFocusOut(message.direction);
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
  if (!window.bitwardenAutofillInit) {
    window.bitwardenAutofillInit = new AutofillInit();
    window.bitwardenAutofillInit.init();
  }
})();
