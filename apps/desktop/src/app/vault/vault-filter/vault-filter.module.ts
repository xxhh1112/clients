import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { VaultFilterService } from "@bitwarden/angular/vault/vault-filter/services/vault-filter.service";
import { CipherService } from "@bitwarden/common/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { FolderService } from "@bitwarden/common/abstractions/folder/folder.service.abstraction";
import { OrganizationService } from "@bitwarden/common/abstractions/organization.service";
import { PolicyService } from "@bitwarden/common/abstractions/policy/policy.service.abstraction";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { DeprecatedVaultFilterService as DeprecatedVaultFilterServiceAbstraction } from "@bitwarden/common/abstractions/vault-filter.service";

import { CollectionFilterComponent } from "./filters/collection-filter.component";
import { FolderFilterComponent } from "./filters/folder-filter.component";
import { OrganizationFilterComponent } from "./filters/organization-filter.component";
import { StatusFilterComponent } from "./filters/status-filter.component";
import { TypeFilterComponent } from "./filters/type-filter.component";
import { VaultFilterComponent } from "./vault-filter.component";


@NgModule({
  imports: [BrowserModule, JslibModule],
  declarations: [
    VaultFilterComponent,
    CollectionFilterComponent,
    FolderFilterComponent,
    OrganizationFilterComponent,
    StatusFilterComponent,
    TypeFilterComponent,
  ],
  exports: [VaultFilterComponent],
  providers: [
    {
      provide: DeprecatedVaultFilterServiceAbstraction,
      useClass: VaultFilterService,
      deps: [
        StateService,
        OrganizationService,
        FolderService,
        CipherService,
        CollectionService,
        PolicyService,
      ],
    },
  ],
})
export class VaultFilterModule {}
