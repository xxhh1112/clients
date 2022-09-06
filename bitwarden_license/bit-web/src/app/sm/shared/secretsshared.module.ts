import { NgModule } from "@angular/core";

import { SharedModule } from "src/app/shared";

// Register the locales for the application
import { FilterComponent } from "../layout/filter.component";
import { HeaderComponent } from "../layout/header.component";
import { NewMenuComponent } from "../layout/new.menu.component";

/**
 * This NgModule should contain the most basic shared directives, pipes, and components. They
 * should be widely used by other modules to be considered for adding to this module. If in doubt
 * do not add to this module.
 *
 * See: https://angular.io/guide/module-types#shared-ngmodules
 */
@NgModule({
  imports: [SharedModule],
  exports: [HeaderComponent, FilterComponent, NewMenuComponent],
  declarations: [HeaderComponent, FilterComponent, NewMenuComponent],
  providers: [],
  bootstrap: [],
})
export class SecretsSharedModule {}
