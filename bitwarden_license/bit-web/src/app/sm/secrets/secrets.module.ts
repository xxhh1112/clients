import { NgModule } from "@angular/core";

import { SecretsSharedModule } from "../shared/sm-shared.module";

import { SecretDeleteDialogComponent } from "./dialog/secret-delete.component";
import { SecretDialogComponent } from "./dialog/secret-dialog.component";
import { SecretsListComponent } from "./secrets-list.component";
import { SecretsRoutingModule } from "./secrets-routing.module";
import { SecretsComponent } from "./secrets.component";

@NgModule({
  imports: [SecretsSharedModule, SecretsRoutingModule],
  declarations: [
    SecretsComponent,
    SecretsListComponent,
    SecretDialogComponent,
    SecretDeleteDialogComponent,
  ],
  providers: [],
})
export class SecretsModule {}
