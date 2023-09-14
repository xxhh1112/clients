import { NgModule } from "@angular/core";

import { SharedModule } from "../shared";

import { I18nTagDirective } from "./i18n-tag.directive";
import { I18nComponent } from "./i18n.component";

@NgModule({
  imports: [SharedModule],
  declarations: [I18nComponent, I18nTagDirective],
  exports: [I18nComponent, I18nTagDirective],
})
export class I18nModule {}
