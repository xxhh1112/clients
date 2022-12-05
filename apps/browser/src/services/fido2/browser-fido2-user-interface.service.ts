import { Fido2UserInterfaceService as Fido2UserInterfaceServiceAbstraction } from "@bitwarden/common/abstractions/fido2/fido2-user-interface.service.abstraction";

import { BrowserApi } from "../../browser/browserApi";
import { PopupUtilsService } from "../../popup/services/popup-utils.service";

const BrowserFido2MessageName = "BrowserFido2UserInterfaceServiceMessage";

type BrowserFido2Message = {
  type: "VerifyUserRequest";
  id: string;
};

export interface BrowserFido2UserInterfaceRequestData {
  requestId: string;
}

export class BrowserFido2UserInterfaceService implements Fido2UserInterfaceServiceAbstraction {
  constructor(private popupUtilsService: PopupUtilsService) {
    BrowserApi.messageListener(BrowserFido2MessageName, this.processMessage.bind(this));
  }

  async verifyUser(): Promise<boolean> {
    return false;
  }

  async verifyPresence(): Promise<boolean> {
    // eslint-disable-next-line no-console
    console.log("User Presence Verification requested");
    const id = "test";
    this.popupUtilsService.popOut(null, `popup/index.html?uilocation=popout#/fido2?id=${id}`);
    return await new Promise((resolve) => setTimeout(resolve, 60000));
  }

  private processMessage(msg: BrowserFido2Message) {
    // eslint-disable-next-line no-console
    console.log("BrowserFido2UserInterfaceService.processMessage", { msg });
  }

  private sendMessage(msg: BrowserFido2Message) {
    chrome.runtime.sendMessage({ test: "wat" });
    BrowserApi.sendMessage(BrowserFido2MessageName, msg);
  }
}
