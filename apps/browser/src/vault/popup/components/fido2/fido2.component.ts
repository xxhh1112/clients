import { Component, NgZone, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import {
  BehaviorSubject,
  combineLatest,
  concatMap,
  filter,
  map,
  Observable,
  Subject,
  take,
  takeUntil,
} from "rxjs";

import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { PasswordRepromptService } from "@bitwarden/common/vault/abstractions/password-reprompt.service";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { Fido2KeyView } from "@bitwarden/common/vault/models/view/fido2-key.view";

import {
  BrowserFido2Message,
  BrowserFido2UserInterfaceSession,
} from "../../../../services/fido2/browser-fido2-user-interface.service";

interface ViewData {
  message: BrowserFido2Message;
  showUnsupportedVerification: boolean;
  fallbackSupported: boolean;
}

@Component({
  selector: "app-fido2",
  templateUrl: "fido2.component.html",
  styleUrls: [],
})
export class Fido2Component implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  protected data$: Observable<ViewData>;
  protected sessionId?: string;
  protected ciphers?: CipherView[] = [];
  protected loading = false;

  private message$ = new BehaviorSubject<BrowserFido2Message>(null);

  constructor(
    private activatedRoute: ActivatedRoute,
    private cipherService: CipherService,
    private passwordRepromptService: PasswordRepromptService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    const sessionId$ = this.activatedRoute.queryParamMap.pipe(
      take(1),
      map((queryParamMap) => queryParamMap.get("sessionId"))
    );

    // Duplicated from BrowserApi.MessageListener$, but adds ngZone.run to make sure
    // Angular change detection knows when a new value is emitted. Otherwise it is outside the zone.
    // TODO: refactor so that this is reusable in other components to help others avoid this trap!
    const messageListener$ = new Observable<unknown>((subscriber) => {
      const handler = (message: unknown) => this.ngZone.run(() => subscriber.next(message)); // <-- the magic is here
      chrome.runtime.onMessage.addListener(handler);
      return () => chrome.runtime.onMessage.removeListener(handler);
    }) as Observable<BrowserFido2Message>;

    combineLatest([sessionId$, messageListener$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([sessionId, message]) => {
        this.sessionId = sessionId;
        if (message.type === "NewSessionCreatedRequest" && message.sessionId !== sessionId) {
          return this.abort(false);
        }

        if (message.sessionId !== sessionId) {
          return;
        }

        if (message.type === "AbortRequest") {
          return this.abort(false);
        }

        this.message$.next(message);
      });

    // setInterval(() => this.message$.next(null), 500);

    this.data$ = this.message$.pipe(
      filter((message) => message != undefined),
      concatMap(async (message) => {
        if (message.type === "ConfirmNewCredentialRequest") {
          const cipher = new CipherView();
          cipher.name = message.credentialName;
          cipher.type = CipherType.Fido2Key;
          cipher.fido2Key = new Fido2KeyView();
          cipher.fido2Key.userName = message.userName;
          this.ciphers = [cipher];
        } else if (message.type === "PickCredentialRequest") {
          this.ciphers = await Promise.all(
            message.cipherIds.map(async (cipherId) => {
              const cipher = await this.cipherService.get(cipherId);
              return cipher.decrypt();
            })
          );
        } else if (message.type === "ConfirmNewNonDiscoverableCredentialRequest") {
          this.ciphers = (await this.cipherService.getAllDecrypted()).filter(
            (cipher) => cipher.type === CipherType.Login && !cipher.isDeleted
          );
        } else if (message.type === "InformExcludedCredentialRequest") {
          this.ciphers = await Promise.all(
            message.existingCipherIds.map(async (cipherId) => {
              const cipher = await this.cipherService.get(cipherId);
              return cipher.decrypt();
            })
          );
        }

        return {
          message,
          showUnsupportedVerification:
            "userVerification" in message &&
            message.userVerification &&
            !(await this.passwordRepromptService.enabled()),
          fallbackSupported: "fallbackSupported" in message && message.fallbackSupported,
        };
      }),
      takeUntil(this.destroy$)
    );

    sessionId$.pipe(takeUntil(this.destroy$)).subscribe((sessionId) => {
      this.send({
        sessionId: sessionId,
        type: "ConnectResponse",
      });
    });
  }

  async pick(cipher: CipherView) {
    const data = this.message$.value;
    if (data?.type === "PickCredentialRequest") {
      let userVerified = false;
      if (data.userVerification) {
        userVerified = await this.passwordRepromptService.showPasswordPrompt();
      }

      this.send({
        sessionId: this.sessionId,
        cipherId: cipher.id,
        type: "PickCredentialResponse",
        userVerified,
      });
    } else if (data?.type === "ConfirmNewNonDiscoverableCredentialRequest") {
      let userVerified = false;
      if (data.userVerification) {
        userVerified = await this.passwordRepromptService.showPasswordPrompt();
      }

      this.send({
        sessionId: this.sessionId,
        cipherId: cipher.id,
        type: "ConfirmNewNonDiscoverableCredentialResponse",
        userVerified,
      });
    }

    this.loading = true;
  }

  async confirm() {
    const data = this.message$.value;
    if (data.type !== "ConfirmNewCredentialRequest") {
      return;
    }

    let userVerified = false;
    if (data.userVerification) {
      userVerified = await this.passwordRepromptService.showPasswordPrompt();
    }

    this.send({
      sessionId: this.sessionId,
      type: "ConfirmNewCredentialResponse",
      userVerified,
    });
    this.loading = true;
  }

  abort(fallback: boolean) {
    this.unload(fallback);
    window.close();
  }

  unload(fallback = false) {
    this.send({
      sessionId: this.sessionId,
      type: "AbortResponse",
      fallbackRequested: fallback,
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private send(msg: BrowserFido2Message) {
    BrowserFido2UserInterfaceSession.sendMessage({
      sessionId: this.sessionId,
      ...msg,
    });
  }
}
