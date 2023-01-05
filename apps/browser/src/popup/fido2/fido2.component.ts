import { Component, HostListener, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Subject, takeUntil } from "rxjs";

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
  protected cipher?: CipherView;

  constructor(private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((queryParamMap) => {
      this.data = JSON.parse(queryParamMap.get("data"));

      if (this.data?.type === "ConfirmNewCredentialRequest") {
        this.cipher = new CipherView();
        this.cipher.name = this.data.name;
        this.cipher.type = CipherType.Fido2Key;
        this.cipher.fido2Key = new Fido2KeyView();
      }
    });
  }

  async accept() {
    const data = this.data;

    if (data.type === "VerifyUserRequest") {
      BrowserFido2UserInterfaceService.sendMessage({
        requestId: data.requestId,
        type: "VerifyUserResponse",
      });
    } else if (data.type === "ConfirmNewCredentialRequest") {
      BrowserFido2UserInterfaceService.sendMessage({
        requestId: data.requestId,
        type: "ConfirmNewCredentialResponse",
      });
    } else {
      BrowserFido2UserInterfaceService.sendMessage({
        requestId: data.requestId,
        type: "RequestCancelled",
        fallbackRequested: true,
      });
    }

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
