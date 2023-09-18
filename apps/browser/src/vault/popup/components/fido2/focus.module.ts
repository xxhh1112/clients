import { NgModule } from "@angular/core";

import { FocusOnLoadDirective } from "./focus.directive";

@NgModule({
  declarations: [FocusOnLoadDirective],
  exports: [FocusOnLoadDirective],
})
export class FocusModule {}
