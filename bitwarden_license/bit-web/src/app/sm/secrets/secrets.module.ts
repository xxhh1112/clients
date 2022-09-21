import { NgModule } from "@angular/core";

import { SharedModule } from "src/app/shared/shared.module";

import { SecretsSharedModule } from "../shared/sm-shared.module";

import { SecretDialogComponent } from "./dialog/secret-dialog.component";
import { SecretsListComponent } from "./secrets-list.component";
import { SecretsRoutingModule } from "./secrets-routing.module";
import { SecretsComponent } from "./secrets.component";

@NgModule({
  imports: [SharedModule, SecretsRoutingModule, SecretsSharedModule],
  declarations: [SecretsComponent, SecretsListComponent, SecretDialogComponent],
  providers: [],
})
export class SecretsModule {}
