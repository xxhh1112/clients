import { Component, HostBinding, Input } from "@angular/core";

@Component({
  selector: "bit-side-menu-header",
  template: `<div class="tw-text-bold tw-text-lg tw-text-contrast">{{ name }}</div>
    <ng-content></ng-content>`,
})
export class SideMenuHeaderComponent {
  @HostBinding("class") classes = ["tw-block", "tw-p-3"];

  @Input() name: string;
}
