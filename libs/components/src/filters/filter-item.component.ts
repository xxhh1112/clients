import { Component, HostBinding, Input } from "@angular/core";

import { Item } from "./item.model";

@Component({
  selector: "bit-filter-item",
  template: `
    <h3 class="tw-text-contrast">{{ name }}</h3>
    <ng-content></ng-content>
  `,
})
export class FilterItemComponent {
  @Input() name: string;
  @Input() icon: string;
  @Input() children: Item[];

  @HostBinding("class") classes = ["tw-block", "tw-p-3"];
}
