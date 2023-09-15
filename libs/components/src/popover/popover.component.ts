import { A11yModule } from "@angular/cdk/a11y";
import { Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from "@angular/core";

import { ButtonModule } from "../button";
import { IconButtonModule } from "../icon-button/icon-button.module";
import { SharedModule } from "../shared/shared.module";

import { WalkthroughService } from "./walkthrough.service";

@Component({
  standalone: true,
  selector: "bit-popover",
  imports: [A11yModule, IconButtonModule, ButtonModule, SharedModule],
  templateUrl: "./popover.component.html",
  exportAs: "popoverComponent",
})
export class PopoverComponent {
  @ViewChild(TemplateRef) templateRef: TemplateRef<any>;
  @Input() header = "";
  @Output() closed = new EventEmitter();

  constructor(private walkthroughService: WalkthroughService) {}

  get showNextBtn() {
    return !this.walkthroughService.isLast();
  }

  get showBackBtn() {
    return !this.walkthroughService.isFirst();
  }

  next() {
    this.walkthroughService.next();
  }

  back() {
    this.walkthroughService.back();
  }
}
