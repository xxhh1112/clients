import { NgModule } from "@angular/core";

import { ComponentsModule } from "./components/components.module";
import { OrganizationManageModule } from "./organizations/manage/organization-manage.module";
import { OrganizationUserModule } from "./organizations/users/organization-user.module";
import { PipesModule } from "./pipes/pipes.module";
import { SharedModule } from "./shared.module";
import { VaultFilterModule } from "./vault-filter/vault-filter.module";
import { OrganizationBadgeModule } from "./vault/modules/organization-badge/organization-badge.module";

@NgModule({
  imports: [
    SharedModule,
    ComponentsModule,
    VaultFilterModule,
    OrganizationBadgeModule,
    PipesModule,
    OrganizationManageModule,
    OrganizationUserModule,
  ],
  exports: [ComponentsModule, VaultFilterModule, OrganizationBadgeModule, PipesModule],
  bootstrap: [],
})
export class OssModule {}
