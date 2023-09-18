import { A11yModule } from "@angular/cdk/a11y";
import { AfterContentInit, Component, ContentChildren, OnInit, QueryList } from "@angular/core";

import { IconButtonModule } from "../icon-button/icon-button.module";
import { SharedModule } from "../shared/shared.module";

import { PopoverTriggerForDirective } from "./popover-trigger-for.directive";
import { WalkthroughService } from "./walkthrough.service";

@Component({
  standalone: true,
  selector: "bit-walkthrough-wrapper",
  imports: [A11yModule, IconButtonModule, SharedModule],
  templateUrl: "./walkthrough-wrapper.component.html",
})
export class WalkthroughWrapperComponent implements OnInit, AfterContentInit {
  @ContentChildren(PopoverTriggerForDirective, { descendants: true })
  triggers: QueryList<PopoverTriggerForDirective>;

  constructor(private walkthroughService: WalkthroughService) {}

  ngOnInit() {
    this.walkthroughService.isWalkthrough = true;
  }

  ngAfterContentInit() {
    this.walkthroughService.triggers = this.triggers.toArray();
  }
}
