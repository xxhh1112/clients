import { NgModule } from "@angular/core";

import { SharedModule } from "src/app/shared/shared.module";

import { FilterComponent } from "../layout/filter.component";
import { HeaderComponent } from "../layout/header.component";
import { NewMenuComponent } from "../layout/new-menu.component";
import { SecretsSharedModule } from "../shared/sm-shared.module";

import { SecretDialogComponent } from "./dialog/secret-dialog.component";
import { SecretsListComponent } from "./secrets-list.component";
import { SecretsRoutingModule } from "./secrets-routing.module";
import { SecretsComponent } from "./secrets.component";

@NgModule({
  imports: [SharedModule, SecretsRoutingModule, SecretsSharedModule],
  declarations: [
    SecretsComponent,
    SecretsListComponent,
    SecretDialogComponent,
    HeaderComponent,
    FilterComponent,
    NewMenuComponent,
  ],
  providers: [],
})
export class SecretsModule {}
