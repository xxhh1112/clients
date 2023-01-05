import { filter, first, lastValueFrom, Subject, takeUntil } from "rxjs";

import {
  Fido2UserInterfaceService as Fido2UserInterfaceServiceAbstraction,
  NewCredentialParams,
} from "@bitwarden/common/abstractions/fido2/fido2-user-interface.service.abstraction";
import { Utils } from "@bitwarden/common/misc/utils";

import { RequestAbortedError } from "../../../../../libs/common/src/abstractions/fido2/fido2.service.abstraction";
import { BrowserApi } from "../../browser/browserApi";
import { PopupUtilsService } from "../../popup/services/popup-utils.service";

const BrowserFido2MessageName = "BrowserFido2UserInterfaceServiceMessage";

export type BrowserFido2Message = { requestId: string } & (
  | {
      type: "PickCredentialRequest";
      cipherIds: string[];
    }
  | {
      type: "PickCredentialResponse";
      cipherId?: string;
    }
  | {
      type: "ConfirmCredentialRequest";
      cipherId: string;
    }
  | {
      type: "ConfirmCredentialResponse";
    }
  | {
      type: "ConfirmNewCredentialRequest";
      credentialName: string;
      userName: string;
    }
  | {
      type: "ConfirmNewCredentialResponse";
    }
  | {
      type: "RequestCancelled";
      fallbackRequested: boolean;
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

  async confirmCredential(cipherId: string): Promise<boolean> {
    const requestId = Utils.newGuid();
    const data: BrowserFido2Message = { type: "ConfirmCredentialRequest", cipherId, requestId };
    const queryParams = new URLSearchParams({ data: JSON.stringify(data) }).toString();
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

    if (response.type === "ConfirmCredentialResponse") {
      return true;
    }

    if (response.type === "RequestCancelled") {
      throw new RequestAbortedError(response.fallbackRequested);
    }

    return false;
  }

  async pickCredential(cipherIds: string[]): Promise<string> {
    const requestId = Utils.newGuid();
    const data: BrowserFido2Message = { type: "PickCredentialRequest", cipherIds, requestId };
    const queryParams = new URLSearchParams({ data: JSON.stringify(data) }).toString();
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

    if (response.type === "RequestCancelled") {
      throw new RequestAbortedError(response.fallbackRequested);
    }

    if (response.type !== "PickCredentialResponse") {
      throw new RequestAbortedError();
    }

    return response.cipherId;
  }

  async confirmNewCredential({ credentialName, userName }: NewCredentialParams): Promise<boolean> {
    const requestId = Utils.newGuid();
    const data: BrowserFido2Message = {
      type: "ConfirmNewCredentialRequest",
      requestId,
      credentialName,
      userName,
    };
    const queryParams = new URLSearchParams({ data: JSON.stringify(data) }).toString();
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

    if (response.type === "ConfirmNewCredentialResponse") {
      return true;
    }

    if (response.type === "RequestCancelled") {
      throw new RequestAbortedError(response.fallbackRequested);
    }

    return false;
  }

  private processMessage(msg: BrowserFido2Message) {
    this.messages$.next(msg);
  }
}
