import { NgModule } from "@angular/core";

import { GetOrgNameFromIdPipe } from "./get-organization-name.pipe";
import { GetCollectionNameFromIdPipe } from "./get-collection-name.pipe";

@NgModule({
  declarations: [GetOrgNameFromIdPipe, GetCollectionNameFromIdPipe],
  exports: [GetOrgNameFromIdPipe, GetCollectionNameFromIdPipe],
})
export class PipesModule {}
