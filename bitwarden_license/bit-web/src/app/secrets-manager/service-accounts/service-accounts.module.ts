import { NgModule } from "@angular/core";

import { SecretsManagerSharedModule } from "../shared/sm-shared.module";

import { ServiceAccountDialogComponent } from "./dialog/service-account-dialog.component";
import { ServiceAccountsListComponent } from "./service-accounts-list.component";
import { ServiceAccountsRoutingModule } from "./service-accounts-routing.module";
import { ServiceAccountsComponent } from "./service-accounts.component";

@NgModule({
  imports: [SecretsManagerSharedModule, ServiceAccountsRoutingModule],
  declarations: [
    ServiceAccountsComponent,
    ServiceAccountsListComponent,
    ServiceAccountDialogComponent,
  ],
  providers: [],
})
export class ServiceAccountsModule {}
