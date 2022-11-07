import { DialogModule as CdkDialogModule } from "@angular/cdk/dialog";
import { ModuleWithProviders, NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

import { IconButtonModule } from "../icon-button";
import { SharedModule } from "../shared";

import { DialogRouterService } from "./dialog-router/dialog-router.service";
import { DialogService } from "./dialog.service";
import { DialogComponent } from "./dialog/dialog.component";
import { DialogCloseDirective } from "./directives/dialog-close.directive";
import { DialogTitleContainerDirective } from "./directives/dialog-title-container.directive";
import { SimpleDialogComponent } from "./simple-dialog/simple-dialog.component";

@NgModule({
  imports: [SharedModule, IconButtonModule, CdkDialogModule, RouterModule],
  declarations: [
    DialogCloseDirective,
    DialogTitleContainerDirective,
    DialogComponent,
    SimpleDialogComponent,
  ],
  exports: [CdkDialogModule, DialogComponent, SimpleDialogComponent],
  providers: [],
})
export class DialogModule {
  static forRoot(): ModuleWithProviders<DialogModule> {
    return {
      ngModule: DialogModule,
      providers: [DialogService, DialogRouterService],
    };
  }
}
