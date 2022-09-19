import { NgModule } from "@angular/core";

import { GetOrgNameFromIdPipe } from "./get-organization-name.pipe";
import { GetCollectionNameFromIdPipe } from "./get-collection-name.pipe";
import { GetGroupNameFromIdPipe } from "./get-group-name.pipe";

@NgModule({
  declarations: [GetOrgNameFromIdPipe, GetCollectionNameFromIdPipe, GetGroupNameFromIdPipe],
  exports: [GetOrgNameFromIdPipe, GetCollectionNameFromIdPipe, GetGroupNameFromIdPipe],
})
export class PipesModule {}
