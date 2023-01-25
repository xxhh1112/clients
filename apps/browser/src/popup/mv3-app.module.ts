import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import { AppModule } from "./app.module";
import { Mv3ServicesModule } from "./services/mv3-services.module";

@NgModule({
  imports: [AppModule, Mv3ServicesModule],
  bootstrap: [AppComponent],
})
export class Mv3AppModule {}
