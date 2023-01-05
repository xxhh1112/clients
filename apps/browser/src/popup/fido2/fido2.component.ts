import { Component, HostListener, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { concatMap, Subject, takeUntil } from "rxjs";

import { CipherService } from "@bitwarden/common/abstractions/cipher.service";
import { CipherType } from "@bitwarden/common/enums/cipherType";
import { CipherView } from "@bitwarden/common/models/view/cipher.view";
import { Fido2KeyView } from "@bitwarden/common/models/view/fido2-key.view";

import {
  BrowserFido2Message,
  BrowserFido2UserInterfaceService,
} from "../../services/fido2/browser-fido2-user-interface.service";

@Component({
  selector: "app-fido2",
  templateUrl: "fido2.component.html",
  styleUrls: [],
})
export class Fido2Component implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  protected data?: BrowserFido2Message;
  protected ciphers?: CipherView[] = [];

  constructor(private activatedRoute: ActivatedRoute, private cipherService: CipherService) {}

  ngOnInit(): void {
    this.activatedRoute.queryParamMap
      .pipe(
        concatMap(async (queryParamMap) => {
          this.data = JSON.parse(queryParamMap.get("data"));

          if (this.data?.type === "ConfirmNewCredentialRequest") {
            const cipher = new CipherView();
            cipher.name = this.data.credentialName;
            cipher.type = CipherType.Fido2Key;
            cipher.fido2Key = new Fido2KeyView();
            cipher.fido2Key.userName = this.data.userName;
            this.ciphers = [cipher];
          } else if (this.data?.type === "ConfirmCredentialRequest") {
            const cipher = await this.cipherService.get(this.data.cipherId);
            this.ciphers = [await cipher.decrypt()];
          } else if (this.data?.type === "PickCredentialRequest") {
            this.ciphers = await Promise.all(
              this.data.cipherIds.map(async (cipherId) => {
                const cipher = await this.cipherService.get(cipherId);
                return cipher.decrypt();
              })
            );
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  async pick(cipher: CipherView) {
    BrowserFido2UserInterfaceService.sendMessage({
      requestId: this.data.requestId,
      cipherId: cipher.id,
      type: "PickCredentialResponse",
    });

    window.close();
  }

  confirm() {
    BrowserFido2UserInterfaceService.sendMessage({
      requestId: this.data.requestId,
      type: "ConfirmCredentialResponse",
    });
    window.close();
  }

  confirmNew() {
    BrowserFido2UserInterfaceService.sendMessage({
      requestId: this.data.requestId,
      type: "ConfirmNewCredentialResponse",
    });
    window.close();
  }

  cancel(fallback: boolean) {
    this.unload(fallback);
    window.close();
  }

  @HostListener("window:unload")
  unload(fallback = true) {
    const data = this.data;
    BrowserFido2UserInterfaceService.sendMessage({
      requestId: data.requestId,
      type: "RequestCancelled",
      fallbackRequested: fallback,
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
