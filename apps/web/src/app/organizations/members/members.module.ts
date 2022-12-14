import { ComponentFactoryResolver, NgModule } from "@angular/core";

import { ModalService } from "@bitwarden/angular/services/modal.service";

import { LooseComponentsModule } from "../../shared";
import { SharedOrganizationModule } from "../shared";

import { BulkConfirmComponent } from "./components/bulk/bulk-confirm.component";
import { BulkRemoveComponent } from "./components/bulk/bulk-remove.component";
import { BulkRestoreRevokeComponent } from "./components/bulk/bulk-restore-revoke.component";
import { BulkStatusComponent } from "./components/bulk/bulk-status.component";
import { UserDialogModule } from "./components/member-dialog";
import { ResetPasswordComponent } from "./components/reset-password.component";
import { UserGroupsComponent } from "./components/user-groups.component";
import { MembersRoutingModule } from "./members-routing.module";
import { PeopleComponent } from "./people.component";

@NgModule({
  imports: [
    SharedOrganizationModule,
    LooseComponentsModule,
    MembersRoutingModule,
    UserDialogModule,
  ],
  declarations: [
    BulkConfirmComponent,
    BulkRemoveComponent,
    BulkRestoreRevokeComponent,
    BulkStatusComponent,
    PeopleComponent,
    ResetPasswordComponent,
    UserGroupsComponent,
  ],
})
export class MembersModule {
  constructor(modalService: ModalService, componentFactoryResolver: ComponentFactoryResolver) {
    modalService.registerComponentFactoryResolver(UserGroupsComponent, componentFactoryResolver);
  }
}
