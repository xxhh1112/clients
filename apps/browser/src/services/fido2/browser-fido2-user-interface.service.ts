import { filter, first, lastValueFrom, Observable, Subject, takeUntil } from "rxjs";

import { Utils } from "@bitwarden/common/misc/utils";
import {
  Fido2UserInterfaceService as Fido2UserInterfaceServiceAbstraction,
  Fido2UserInterfaceSession,
  NewCredentialParams,
} from "@bitwarden/common/webauthn/abstractions/fido2-user-interface.service.abstraction";

import { BrowserApi } from "../../browser/browserApi";
import { PopupUtilsService } from "../../popup/services/popup-utils.service";

const BrowserFido2MessageName = "BrowserFido2UserInterfaceServiceMessage";

export class Fido2Error extends Error {
  constructor(message: string, readonly fallbackRequested = false) {
    super(message);
  }
}

export class RequestAbortedError extends Fido2Error {
  constructor(fallbackRequested = false) {
    super("Fido2 request was aborted", fallbackRequested);
  }
}

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
      type: "ConfirmNewNonDiscoverableCredentialRequest";
      credentialName: string;
      userName: string;
    }
  | {
      type: "ConfirmNewNonDiscoverableCredentialResponse";
      cipherId: string;
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

  async newSession(abortController?: AbortController): Promise<Fido2UserInterfaceSession> {
    return await BrowserFido2UserInterfaceSession.create(this, abortController);
  }

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

  async confirmNewNonDiscoverableCredential(
    { credentialName, userName }: NewCredentialParams,
    abortController?: AbortController
  ): Promise<string> {
    const requestId = Utils.newGuid();
    const data: BrowserFido2Message = {
      type: "ConfirmNewNonDiscoverableCredentialRequest",
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

    if (response.type === "ConfirmNewNonDiscoverableCredentialResponse") {
      return response.cipherId;
    }

    if (response.type === "AbortResponse") {
      throw new RequestAbortedError(response.fallbackRequested);
    }

    abortController.signal.removeEventListener("abort", abortHandler);

    return undefined;
  }

  async informExcludedCredential(
    existingCipherIds: string[],
    newCredential: NewCredentialParams,
    abortController?: AbortController
  ): Promise<void> {
    // Not Implemented
  }

  private setAbortTimeout(abortController: AbortController) {
    return setTimeout(() => abortController.abort());
  }
}

export class BrowserFido2UserInterfaceSession implements Fido2UserInterfaceSession {
  static async create(
    parentService: BrowserFido2UserInterfaceService,
    abortController?: AbortController
  ): Promise<BrowserFido2UserInterfaceSession> {
    return new BrowserFido2UserInterfaceSession(parentService, abortController);
  }

  readonly abortListener: () => void;

  private constructor(
    private readonly parentService: BrowserFido2UserInterfaceService,
    readonly abortController = new AbortController(),
    readonly sessionId = Utils.newGuid()
  ) {
    this.abortListener = () => this.abort();
    abortController.signal.addEventListener("abort", this.abortListener);
  }

  fallbackRequested = false;

  get aborted() {
    return this.abortController.signal.aborted;
  }

  confirmCredential(cipherId: string, abortController?: AbortController): Promise<boolean> {
    return this.parentService.confirmCredential(cipherId, this.abortController);
  }

  pickCredential(cipherIds: string[], abortController?: AbortController): Promise<string> {
    return this.parentService.pickCredential(cipherIds, this.abortController);
  }

  confirmNewCredential(
    params: NewCredentialParams,
    abortController?: AbortController
  ): Promise<boolean> {
    return this.parentService.confirmNewCredential(params, this.abortController);
  }

  confirmNewNonDiscoverableCredential(
    params: NewCredentialParams,
    abortController?: AbortController
  ): Promise<string> {
    return this.parentService.confirmNewNonDiscoverableCredential(params, this.abortController);
  }

  informExcludedCredential(
    existingCipherIds: string[],
    newCredential: NewCredentialParams,
    abortController?: AbortController
  ): Promise<void> {
    return this.parentService.informExcludedCredential(
      existingCipherIds,
      newCredential,
      this.abortController
    );
  }

  private abort() {
    this.close();
  }

  private close() {
    this.abortController.signal.removeEventListener("abort", this.abortListener);
  }
}
