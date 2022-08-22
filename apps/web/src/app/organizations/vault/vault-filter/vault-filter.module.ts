import { NgModule } from "@angular/core";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CipherService } from "@bitwarden/common/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { FolderService } from "@bitwarden/common/abstractions/folder/folder.service.abstraction";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { OrganizationService } from "@bitwarden/common/abstractions/organization.service";
import { PolicyService } from "@bitwarden/common/abstractions/policy/policy.service.abstraction";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { VaultFilterService as VaultFilterServiceAbstraction } from "@bitwarden/common/abstractions/vault-filter.service";

import { VaultFilterSharedModule } from "../../../vault/vault-filter/shared/vault-filter-shared.module";

import { VaultFilterComponent } from "./vault-filter.component";
import { VaultFilterService } from "./vault-filter.service";

@NgModule({
  imports: [VaultFilterSharedModule],
  declarations: [VaultFilterComponent],
  exports: [VaultFilterComponent],
  providers: [
    {
      provide: VaultFilterServiceAbstraction,
      useClass: VaultFilterService,
      deps: [
        StateService,
        OrganizationService,
        FolderService,
        CipherService,
        CollectionService,
        PolicyService,
        ApiService,
        I18nService,
      ],
    },
  ],
})
export class VaultFilterModule {}
