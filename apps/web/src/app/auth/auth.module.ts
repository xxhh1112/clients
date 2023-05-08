import { NgModule } from "@angular/core";

import { CoreAuthModule } from "./core/core.module";
import { Fido2LoginSettingsModule } from "./settings/fido2-login-settings";

@NgModule({
  imports: [CoreAuthModule, Fido2LoginSettingsModule],
  declarations: [],
  providers: [],
  exports: [
    Fido2LoginSettingsModule, // TODO: Remove when `app/settings/change-password.component.ts` has been moved to `app/auth/settings/.`
  ],
})
export class AuthModule {}
