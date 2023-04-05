import { NgModule } from "@angular/core";

import { NavigationModule } from "../navigation";
import { SharedModule } from "../shared";

import { LayoutComponent } from "./layout.component";

@NgModule({
  imports: [SharedModule, NavigationModule],
  declarations: [LayoutComponent],
  exports: [LayoutComponent],
})
export class LayoutModule {}
