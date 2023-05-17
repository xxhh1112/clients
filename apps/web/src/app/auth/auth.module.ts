import { NgModule } from "@angular/core";

import { CoreAuthModule } from "./core/core.module";
import { WebauthnLoginSettingsModule } from "./settings/webauthn-login-settings";

@NgModule({
  imports: [CoreAuthModule, WebauthnLoginSettingsModule],
  declarations: [],
  providers: [],
  exports: [
    WebauthnLoginSettingsModule, // TODO: Remove when `app/settings/change-password.component.ts` has been moved to `app/auth/settings/.`
  ],
})
export class AuthModule {}
