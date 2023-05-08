import { NgModule, Optional, SkipSelf } from "@angular/core";

@NgModule({})
export class CoreAuthModule {
  constructor(@Optional() @SkipSelf() parentModule?: CoreAuthModule) {
    if (parentModule) {
      throw new Error("CoreAuthModule is already loaded. Import it in AuthModule only");
    }
  }
}
