import { NgModule } from "@angular/core";

import { VaultSharedModule } from "src/app/vault/shared/vault-shared.module";

import { CollectionNameBadgeComponent } from "./collection-name.badge.component";

@NgModule({
  imports: [VaultSharedModule],
  declarations: [CollectionNameBadgeComponent],
  exports: [CollectionNameBadgeComponent],
})
export class CollectionBadgeModule {}
