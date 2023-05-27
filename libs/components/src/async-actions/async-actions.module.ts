import { NgModule } from "@angular/core";

import { SharedModule } from "../shared";

import { ActionDirective } from "./bit-action.directive";
import { SubmitDirective } from "./bit-submit.directive";
import { FormButtonDirective } from "./form-button.directive";

@NgModule({
  imports: [SharedModule],
  declarations: [ActionDirective, FormButtonDirective, SubmitDirective],
  exports: [ActionDirective, FormButtonDirective, SubmitDirective],
})
export class AsyncActionsModule {}
