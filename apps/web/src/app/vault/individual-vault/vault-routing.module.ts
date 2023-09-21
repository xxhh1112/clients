import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { postLoginDeepLinkRedirectGuard } from "../../core/guards/post-login-deep-link-redirect.guard";

import { VaultComponent } from "./vault.component";
const routes: Routes = [
  {
    path: "",
    component: VaultComponent,
    data: { titleId: "vaults" },
    canActivate: [postLoginDeepLinkRedirectGuard()],
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VaultRoutingModule {}
