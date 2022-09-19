import { NgModule } from "@angular/core";

import { VaultSharedModule } from "src/app/vault/shared/vault-shared.module";

import { GroupNameBadgeComponent } from "./group-name-badge.component";

@NgModule({
  imports: [VaultSharedModule],
  declarations: [GroupNameBadgeComponent],
  exports: [GroupNameBadgeComponent],
})
export class GroupBadgeModule {}
