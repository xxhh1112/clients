import {
  BehaviorSubject,
  EmptyError,
  filter,
  firstValueFrom,
  fromEvent,
  Observable,
  Subject,
  take,
  takeUntil,
} from "rxjs";

import { Utils } from "@bitwarden/common/misc/utils";
import { UserRequestedFallbackAbortReason } from "@bitwarden/common/webauthn/abstractions/fido2-client.service.abstraction";
import {
  Fido2UserInterfaceService as Fido2UserInterfaceServiceAbstraction,
  Fido2UserInterfaceSession,
  NewCredentialParams,
} from "@bitwarden/common/webauthn/abstractions/fido2-user-interface.service.abstraction";

import { BrowserApi } from "../../browser/browserApi";
import { PopupUtilsService } from "../../popup/services/popup-utils.service";

const BrowserFido2MessageName = "BrowserFido2UserInterfaceServiceMessage";

export class SessionClosedError extends Error {
  constructor() {
    super("Fido2UserInterfaceSession was closed");
  }
}

export type BrowserFido2Message = { sessionId: string } & (
  | /**
   * This message is used by popouts to announce that they are ready
   * to recieve messages.
   **/ {
      type: "ConnectResponse";
    }
  /**
   * This message is used to announce the creation of a new session.
   * It iss used by popouts to know when to close.
   **/
  | {
      type: "NewSessionCreatedRequest";
    }
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

export class BrowserFido2UserInterfaceService implements Fido2UserInterfaceServiceAbstraction {
  constructor(private popupUtilsService: PopupUtilsService) {}

  async newSession(abortController?: AbortController): Promise<Fido2UserInterfaceSession> {
    return await BrowserFido2UserInterfaceSession.create(this.popupUtilsService, abortController);
  }
}

export class BrowserFido2UserInterfaceSession implements Fido2UserInterfaceSession {
  static async create(
    popupUtilsService: PopupUtilsService,
    abortController?: AbortController
  ): Promise<BrowserFido2UserInterfaceSession> {
    return new BrowserFido2UserInterfaceSession(popupUtilsService, abortController);
  }

  static sendMessage(msg: BrowserFido2Message) {
    BrowserApi.sendMessage(BrowserFido2MessageName, msg);
  }

  private closed = false;
  private messages$ = (BrowserApi.messageListener$() as Observable<BrowserFido2Message>).pipe(
    filter((msg) => msg.sessionId === this.sessionId)
  );
  private connected$ = new BehaviorSubject(false);
  private destroy$ = new Subject<void>();

  private constructor(
    private readonly popupUtilsService: PopupUtilsService,
    readonly abortController = new AbortController(),
    readonly sessionId = Utils.newGuid()
  ) {
    this.messages$
      .pipe(
        filter((msg) => msg.type === "ConnectResponse"),
        take(1),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.connected$.next(true);
      });

    // Handle session aborted by RP
    fromEvent(abortController.signal, "abort")
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.close();
        BrowserFido2UserInterfaceSession.sendMessage({
          type: "AbortRequest",
          sessionId: this.sessionId,
        });
      });

    // Handle session aborted by user
    this.messages$
      .pipe(
        filter((msg) => msg.type === "AbortResponse"),
        take(1),
        takeUntil(this.destroy$)
      )
      .subscribe((msg) => {
        if (msg.type === "AbortResponse") {
          this.close();
          this.abortController.abort(
            msg.fallbackRequested ? UserRequestedFallbackAbortReason : undefined
          );
        }
      });

    BrowserFido2UserInterfaceSession.sendMessage({
      type: "NewSessionCreatedRequest",
      sessionId,
    });
  }

  fallbackRequested = false;

  get aborted() {
    return this.abortController.signal.aborted;
  }

  async confirmCredential(cipherId: string): Promise<boolean> {
    const data: BrowserFido2Message = {
      type: "ConfirmCredentialRequest",
      cipherId,
      sessionId: this.sessionId,
    };

    await this.send(data);
    await this.receive("ConfirmCredentialResponse");

    return true;
  }

  async pickCredential(cipherIds: string[]): Promise<string> {
    const data: BrowserFido2Message = {
      type: "PickCredentialRequest",
      cipherIds,
      sessionId: this.sessionId,
    };

    await this.send(data);
    const response = await this.receive("PickCredentialResponse");

    return response.cipherId;
  }

  async confirmNewCredential({ credentialName, userName }: NewCredentialParams): Promise<boolean> {
    const data: BrowserFido2Message = {
      type: "ConfirmNewCredentialRequest",
      sessionId: this.sessionId,
      credentialName,
      userName,
    };

    await this.send(data);
    await this.receive("ConfirmNewCredentialResponse");

    return true;
  }

  async confirmNewNonDiscoverableCredential({
    credentialName,
    userName,
  }: NewCredentialParams): Promise<string> {
    const data: BrowserFido2Message = {
      type: "ConfirmNewNonDiscoverableCredentialRequest",
      sessionId: this.sessionId,
      credentialName,
      userName,
    };

    await this.send(data);
    const response = await this.receive("ConfirmNewNonDiscoverableCredentialResponse");

    return response.cipherId;
  }

  informExcludedCredential(
    existingCipherIds: string[],
    newCredential: NewCredentialParams,
    abortController?: AbortController
  ): Promise<void> {
    return null;
  }

  private async send(msg: BrowserFido2Message): Promise<void> {
    if (!this.connected$.value) {
      await this.connect();
    }
    BrowserFido2UserInterfaceSession.sendMessage(msg);
  }

  private async receive<T extends BrowserFido2Message["type"]>(
    type: T
  ): Promise<BrowserFido2Message & { type: T }> {
    try {
      const response = await firstValueFrom(
        this.messages$.pipe(
          filter((msg) => msg.sessionId === this.sessionId && msg.type === type),
          takeUntil(this.destroy$)
        )
      );
      return response as BrowserFido2Message & { type: T };
    } catch (error) {
      if (error instanceof EmptyError) {
        throw new SessionClosedError();
      }
      throw error;
    }
  }

  private async connect(): Promise<void> {
    if (this.closed) {
      throw new Error("Cannot re-open closed session");
    }

    const queryParams = new URLSearchParams({ sessionId: this.sessionId }).toString();
    this.popupUtilsService.popOut(
      null,
      `popup/index.html?uilocation=popout#/fido2?${queryParams}`,
      { center: true }
    );
    await firstValueFrom(this.connected$.pipe(filter((connected) => connected === true)));
  }

  private close() {
    this.closed = true;
    this.destroy$.next();
    this.destroy$.complete();
  }
}
