import { Component, HostBinding, Input } from "@angular/core";

import { Item } from "./item.model";

@Component({
  selector: "bit-side-menu-item",
  template: `
    <a
      [routerLink]="item.route"
      routerLinkActive
      (isActiveChange)="isActive = $event"
      [class]="linkClasses"
      >{{ item.name }}</a
    >
    <div class="tw-p-2">
      <ng-content></ng-content>
    </div>
  `,
})
export class SideMenuItemComponent {
  @Input() item: Item;
  @Input() icon: string;

  @HostBinding("class") classes = ["tw-block"];

  protected get linkClasses() {
    return ["tw-text-contrast", "tw-p-3", "hover:tw-text-contrast", "hover:tw-underline"].concat(
      this.isActive ? ["tw-bg-[#122E78]"] : []
    );
  }

  protected isActive = false;
}
