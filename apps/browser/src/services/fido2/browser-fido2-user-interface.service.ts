import { filter, first, lastValueFrom, Subject, takeUntil } from "rxjs";

import { Fido2UserInterfaceService as Fido2UserInterfaceServiceAbstraction } from "@bitwarden/common/abstractions/fido2/fido2-user-interface.service.abstraction";
import { Utils } from "@bitwarden/common/misc/utils";

import { BrowserApi } from "../../browser/browserApi";
import { PopupUtilsService } from "../../popup/services/popup-utils.service";

const BrowserFido2MessageName = "BrowserFido2UserInterfaceServiceMessage";

export type BrowserFido2Message = { requestId: string } & (
  | {
      type: "VerifyUserRequest";
    }
  | {
      type: "VerifyUserResponse";
    }
  | {
      type: "RequestCancelled";
    }
);

export interface BrowserFido2UserInterfaceRequestData {
  requestId: string;
}

export class BrowserFido2UserInterfaceService implements Fido2UserInterfaceServiceAbstraction {
  static sendMessage(msg: BrowserFido2Message) {
    BrowserApi.sendMessage(BrowserFido2MessageName, msg);
  }

  private messages$ = new Subject<BrowserFido2Message>();
  private destroy$ = new Subject<void>();

  constructor(private popupUtilsService: PopupUtilsService) {
    BrowserApi.messageListener(BrowserFido2MessageName, this.processMessage.bind(this));
  }

  async verifyUser(): Promise<boolean> {
    return false;
  }

  async verifyPresence(): Promise<boolean> {
    const requestId = Utils.newGuid();
    const data: BrowserFido2Message = { type: "VerifyUserRequest", requestId };
    const queryParams = new URLSearchParams(data).toString();
    this.popupUtilsService.popOut(
      null,
      `popup/index.html?uilocation=popout#/fido2?${queryParams}`,
      { center: true }
    );

    const response = await lastValueFrom(
      this.messages$.pipe(
        filter((msg) => msg.requestId === requestId),
        first(),
        takeUntil(this.destroy$)
      )
    );

    if (response.type === "VerifyUserResponse") {
      return true;
    }

    return false;
  }

  private processMessage(msg: BrowserFido2Message) {
    this.messages$.next(msg);
  }
}
