import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

import { IconButtonModule, LinkModule, MenuModule } from "@bitwarden/components";

import { BreadcrumbComponent } from "./breadcrumb.component";
import { BreadcrumbsComponent } from "./breadcrumbs.component";

@NgModule({
  imports: [CommonModule, LinkModule, IconButtonModule, MenuModule, RouterModule],
  declarations: [BreadcrumbsComponent, BreadcrumbComponent],
  exports: [BreadcrumbsComponent, BreadcrumbComponent],
})
export class BreadcrumbsModule {}
