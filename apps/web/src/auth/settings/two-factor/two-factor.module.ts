import { NgModule } from "@angular/core";

import { LooseComponentsModule, SharedModule } from "../../../app/shared";

import { TwoFactorAuthenticatorComponent } from "./two-factor-authenticator.component";
import { TwoFactorDuoComponent } from "./two-factor-duo.component";
import { TwoFactorEmailComponent } from "./two-factor-email.component";
import { TwoFactorRecoveryComponent } from "./two-factor-recovery.component";
import { TwoFactorSetupComponent } from "./two-factor-setup.component";
import { TwoFactorVerifyComponent } from "./two-factor-verify.component";
import { TwoFactorWebAuthnComponent } from "./two-factor-webauthn.component";
import { TwoFactorYubiKeyComponent } from "./two-factor-yubikey.component";

@NgModule({
  imports: [SharedModule, LooseComponentsModule],
  declarations: [
    TwoFactorDuoComponent,
    TwoFactorRecoveryComponent,
    TwoFactorSetupComponent,
    TwoFactorVerifyComponent,
    TwoFactorWebAuthnComponent,
    TwoFactorYubiKeyComponent,
    TwoFactorEmailComponent,
    TwoFactorAuthenticatorComponent,
  ],
  exports: [TwoFactorSetupComponent],
})
export class TwoFactorModule {}
