import { NgModule } from "@angular/core";

import { SharedModule } from "src/app/shared/shared.module";

import { SecretsSharedModule } from "../shared/sm-shared.module";

import { SecretsListComponent } from "./secrets-list.component";
import { SecretsRoutingModule } from "./secrets-routing.module";
import { SecretsComponent } from "./secrets.component";

@NgModule({
  imports: [SharedModule, SecretsRoutingModule, SecretsSharedModule],
  declarations: [SecretsComponent, SecretsListComponent],
  providers: [],
})
export class SecretsModule {}
