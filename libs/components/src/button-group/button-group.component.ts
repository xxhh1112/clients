import { Component, EventEmitter, HostBinding, Input, Output } from "@angular/core";

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

  @Output() selectedChange = new EventEmitter<unknown>();

  @HostBinding("attr.role") role = "radiogroup";
  @HostBinding("attr.aria-labelledby") labelId = `bit-button-group-label-${this.id}`;

  onInputInteraction(value: unknown) {
    console.log("onInputInteraction", value);
  }
}
