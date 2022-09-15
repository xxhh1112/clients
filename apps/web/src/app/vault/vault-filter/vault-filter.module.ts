import { NgModule } from "@angular/core";

import { VaultFilterService as VaultFilterServiceAbstraction } from "@bitwarden/common/abstractions/vault-filter.service";

import { LinkSsoComponent } from "./organization-filter/link-sso.component";
import { OrganizationOptionsComponent } from "./organization-filter/organization-options.component";
import { VaultFilterSharedModule } from "./shared/vault-filter-shared.module";
import { VaultFilterComponent } from "./vault-filter.component";
import { VaultFilterService } from "./vault-filter.service";

@NgModule({
  imports: [VaultFilterSharedModule],
  declarations: [VaultFilterComponent, OrganizationOptionsComponent, LinkSsoComponent],
  exports: [VaultFilterComponent],
  providers: [
    {
      provide: VaultFilterServiceAbstraction,
      useClass: VaultFilterService,
    },
  ],
})
export class VaultFilterModule {}
