import { HostBinding, Component, Optional, Inject } from "@angular/core";

import { ButtonGroupComponent } from "./button-group.component";

let nextId = 0;

@Component({
  selector: "bit-button-group-element",
  templateUrl: "./button-group-element.component.html",
})
export class ButtonGroupElementComponent {
  id = nextId++;

  constructor(
    @Optional() @Inject(ButtonGroupComponent) private groupComponent: ButtonGroupComponent
  ) {}

  @HostBinding("class") get classList() {
    return ["tw-group"];
  }

  get name() {
    return this.groupComponent?.name;
  }

  get labelClasses() {
    return [
      "tw-font-semibold",
      "tw-py-1.5",
      "tw-px-3",
      "tw-transition",
      "tw-text-center",
      "tw-border-text-muted",
      "tw-text-muted",
      "tw-border-solid",
      "tw-border-y",
      "tw-border-r",
      "tw-border-l-0",
      "group-first:tw-border-l",
      "group-first:tw-rounded-l",
      "group-last:tw-rounded-r",

      "focus:tw-outline-none",
      "focus:tw-ring",
      "focus:tw-ring-offset-2",
      "focus:tw-ring-primary-700",
      "focus:tw-z-10",
      "focus:tw-bg-primary-700",
      "focus:tw-border-primary-700",

      "hover:tw-no-underline",
      "hover:tw-bg-text-muted",
      "hover:tw-border-text-muted",
      "hover:tw-text-contrast",

      "peer-checked:tw-bg-primary-500",
      "peer-checked:tw-border-primary-500",
      "peer-checked:tw-text-contrast",
    ];
  }
}
