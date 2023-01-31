import { filter, first, lastValueFrom, Observable, Subject, takeUntil } from "rxjs";

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
      type: "AbortRequest";
    }
  | {
      type: "AbortResponse";
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

  static onAbort$(requestId: string): Observable<BrowserFido2Message> {
    const messages$ = BrowserApi.messageListener$() as Observable<BrowserFido2Message>;
    return messages$.pipe(
      filter((message) => message.type === "AbortRequest" && message.requestId === requestId),
      first()
    );
  }

  private messages$ = BrowserApi.messageListener$() as Observable<BrowserFido2Message>;
  private destroy$ = new Subject<void>();

  constructor(private popupUtilsService: PopupUtilsService) {}

  async confirmCredential(
    cipherId: string,
    abortController = new AbortController()
  ): Promise<boolean> {
    const requestId = Utils.newGuid();
    const data: BrowserFido2Message = { type: "ConfirmCredentialRequest", cipherId, requestId };
    const queryParams = new URLSearchParams({ data: JSON.stringify(data) }).toString();

    const abortHandler = () =>
      BrowserFido2UserInterfaceService.sendMessage({ type: "AbortRequest", requestId });
    abortController.signal.addEventListener("abort", abortHandler);

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

    if (response.type === "AbortResponse") {
      throw new RequestAbortedError(response.fallbackRequested);
    }

    abortController.signal.removeEventListener("abort", abortHandler);

    return false;
  }

  async pickCredential(
    cipherIds: string[],
    abortController = new AbortController()
  ): Promise<string> {
    const requestId = Utils.newGuid();
    const data: BrowserFido2Message = { type: "PickCredentialRequest", cipherIds, requestId };
    const queryParams = new URLSearchParams({ data: JSON.stringify(data) }).toString();

    const abortHandler = () =>
      BrowserFido2UserInterfaceService.sendMessage({ type: "AbortRequest", requestId });
    abortController.signal.addEventListener("abort", abortHandler);

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

    if (response.type === "AbortResponse") {
      throw new RequestAbortedError(response.fallbackRequested);
    }

    if (response.type !== "PickCredentialResponse") {
      throw new RequestAbortedError();
    }

    abortController.signal.removeEventListener("abort", abortHandler);

    return response.cipherId;
  }

  async confirmNewCredential(
    { credentialName, userName }: NewCredentialParams,
    abortController = new AbortController()
  ): Promise<boolean> {
    const requestId = Utils.newGuid();
    const data: BrowserFido2Message = {
      type: "ConfirmNewCredentialRequest",
      requestId,
      credentialName,
      userName,
    };
    const queryParams = new URLSearchParams({ data: JSON.stringify(data) }).toString();

    const abortHandler = () =>
      BrowserFido2UserInterfaceService.sendMessage({ type: "AbortRequest", requestId });
    abortController.signal.addEventListener("abort", abortHandler);

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

    if (response.type === "AbortResponse") {
      throw new RequestAbortedError(response.fallbackRequested);
    }

    abortController.signal.removeEventListener("abort", abortHandler);

    return false;
  }
}
