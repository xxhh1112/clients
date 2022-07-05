import { Component, HostBinding, Input } from "@angular/core";

export type ButtonGroupSizes = "small" | "default";

let nextId = 0;

@Component({
  selector: "bit-button-group",
  templateUrl: "./button-group.component.html",
})
export class ButtonGroupComponent {
  private id = nextId++;

  @Input() label?: string;
  @Input() name = `bit-button-group-${this.id}`;
  @Input() size: ButtonGroupSizes = "default";

  @HostBinding("attr.role") role = "radiogroup";
  @HostBinding("attr.aria-labelledby") labelId = `bit-button-group-label-${this.id}`;
}
