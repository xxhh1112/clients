import { NgModule } from "@angular/core";

import { LooseComponentsModule, SharedModule } from "../../shared";
import { PoliciesModule } from "../policies";

import { AccountComponent } from "./account.component";
import { AdjustSubscription } from "./adjust-subscription.component";
import { ChangePlanComponent } from "./change-plan.component";
import { DeleteOrganizationComponent } from "./delete-organization.component";
import { DownloadLicenseComponent } from "./download-license.component";
import { OrganizationSettingsRoutingModule } from "./organization-settings-routing.module";
import { SettingsComponent } from "./settings.component";
import { TwoFactorSetupComponent } from "./two-factor-setup.component";

@NgModule({
  imports: [SharedModule, LooseComponentsModule, PoliciesModule, OrganizationSettingsRoutingModule],
  declarations: [
    SettingsComponent,
    AccountComponent,
    AdjustSubscription,
    ChangePlanComponent,
    DeleteOrganizationComponent,
    DownloadLicenseComponent,
    TwoFactorSetupComponent,
  ],
})
export class OrganizationSettingsModule {}
