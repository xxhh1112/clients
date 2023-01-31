import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import { AppModule } from "./app.module";
import { InPopupServices } from "./services/in-popup-services.module";

@NgModule({
  imports: [AppModule, InPopupServices],
  bootstrap: [AppComponent],
})
export class InPopupAppModule {}
