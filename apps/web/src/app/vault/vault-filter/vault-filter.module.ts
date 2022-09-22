import { NgModule } from "@angular/core";

import { LinkSsoComponent } from "./organization-filter/link-sso.component";
import { OrganizationOptionsComponent } from "./organization-filter/organization-options.component";
import { VaultFilterService as VaultFilterServiceAbstraction } from "./services/abstractions/vault-filter.service";
import { VaultFilterService } from "./services/vault-filter.service";
import { VaultFilterSharedModule } from "./shared/vault-filter-shared.module";
import { VaultFilterComponent } from "./vault-filter.component";

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
