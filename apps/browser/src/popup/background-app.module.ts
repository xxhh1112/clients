import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import { AppModule } from "./app.module";
import { BackgroundServicesModule } from "./services/background-services.module";

// FIXME: This AppModule and BackgroundServicesModule are not in this current branch.
// They should be removed prior to merging this branch into master but are kept around
// to easily reference how it worked before.
@NgModule({
  imports: [AppModule, BackgroundServicesModule],
  bootstrap: [AppComponent],
})
export class BackgroundAppModule {}
