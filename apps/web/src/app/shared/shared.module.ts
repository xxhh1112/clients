import { DragDropModule } from "@angular/cdk/drag-drop";
import { CommonModule, DatePipe } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { InfiniteScrollModule } from "ngx-infinite-scroll";
import { ToastrModule } from "ngx-toastr";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import {
  AvatarModule,
  BadgeModule,
  ButtonModule,
  IconButtonModule,
  CalloutModule,
  FormFieldModule,
  IconModule,
  LinkModule,
  AsyncActionsModule,
  MenuModule,
  TableModule,
  TabsModule,
  DialogModule,
} from "@bitwarden/components";

// Register the locales for the application
import "./locales";

/**
 * This NgModule should contain the most basic shared directives, pipes, and components. They
 * should be widely used by other modules to be considered for adding to this module. If in doubt
 * do not add to this module.
 *
 * See: https://angular.io/guide/module-types#shared-ngmodules
 */
@NgModule({
  imports: [
    CommonModule,
    DragDropModule,
    FormsModule,
    InfiniteScrollModule,
    JslibModule,
    ReactiveFormsModule,
    RouterModule,
    BadgeModule,
    CalloutModule,
    ToastrModule,
    BadgeModule,
    ButtonModule,
    LinkModule,
    MenuModule,
    FormFieldModule,
    IconModule,
    TabsModule,
    TableModule,
    AvatarModule,
    IconButtonModule,
    DialogModule,
  ],
  exports: [
    CommonModule,
    AsyncActionsModule,
    DragDropModule,
    FormsModule,
    InfiniteScrollModule,
    JslibModule,
    ReactiveFormsModule,
    RouterModule,
    CalloutModule,
    ToastrModule,
    BadgeModule,
    ButtonModule,
    LinkModule,
    MenuModule,
    FormFieldModule,
    IconModule,
    TabsModule,
    TableModule,
    AvatarModule,
    IconButtonModule,
    DialogModule,
  ],
  providers: [DatePipe],
  bootstrap: [],
})
export class SharedModule {}
