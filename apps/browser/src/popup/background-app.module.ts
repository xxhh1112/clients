import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import { AppModule } from "./app.module";
import { BackgroundServicesModule } from "./services/background-services.module";

@NgModule({
  imports: [AppModule, BackgroundServicesModule],
  bootstrap: [AppComponent],
})
export class BackgroundAppModule {}
