import { Component } from "@angular/core";
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from "@angular/forms";

import { VaultTimeoutInputComponent as VaultTimeoutInputComponentBase } from "@bitwarden/angular/components/settings/vault-timeout-input.component";
import { Subscription } from "rxjs";

import { BrowserApi } from "../../browser/browserApi";

@Component({
  selector: "app-vault-timeout-input",
  templateUrl: "vault-timeout-input.component.html",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: VaultTimeoutInputComponent,
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: VaultTimeoutInputComponent,
    },
  ],
})
export class VaultTimeoutInputComponent extends VaultTimeoutInputComponentBase {
  private popupClosedSubscription: Subscription;

  async ngOnInit() {
    await super.ngOnInit();
    // eslint-disable-next-line rxjs-angular/prefer-takeuntil
    this.popupClosedSubscription = BrowserApi.popupClosed$(window).subscribe(() => {
      alert("popup closed, calling destroy");
      this.ngOnDestroy();
    });
  }

  async ngOnDestroy() {
    this.popupClosedSubscription.unsubscribe();
    await super.ngOnDestroy();
  }
}
