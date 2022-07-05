import { Component, Input } from "@angular/core";

export type ButtonGroupSizes = "small" | "default";

let nextId = 0;

@Component({
  selector: "bit-button-group",
  templateUrl: "./button-group.component.html",
})
export class ButtonGroupComponent {
  @Input() name = `bit-button-group-${nextId++}`;
  @Input() size: ButtonGroupSizes = "default";
}
