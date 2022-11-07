import { NgModule } from "@angular/core";

import { SharedModule } from "../../../../shared/shared.module";
import { AccessSelectorModule } from "../access-selector";

import { TestDialogRoutingModule } from "./test-dialog-routing.module";
import { TestDialogComponent } from "./test-dialog.component";

@NgModule({
  imports: [SharedModule, AccessSelectorModule, TestDialogRoutingModule],
  declarations: [TestDialogComponent],
  exports: [TestDialogComponent],
})
export class TestDialogModule {}
