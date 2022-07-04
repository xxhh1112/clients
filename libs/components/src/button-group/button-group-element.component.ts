import { HostBinding, Component, Optional, Inject } from "@angular/core";

import { ButtonGroupComponent } from "./button-group.component";

let nextId = 0;

@Component({
  selector: "bit-button-group-element",
  templateUrl: "./button-group-element.component.html",
  host: {
    class: "",
  },
})
export class ButtonGroupElementComponent {
  id = nextId++;

  constructor(
    @Optional() @Inject(ButtonGroupComponent) private groupComponent: ButtonGroupComponent
  ) {}

  @HostBinding("class") get classList() {
    return [];
  }

  get name() {
    return this.groupComponent?.name;
  }

  get labelClasses() {
    return [
      "tw-font-semibold",
      "tw-py-1.5",
      "tw-px-3",
      "tw-rounded",
      "tw-transition",
      "tw-border",
      "tw-border-solid",
      "tw-text-center",
      "hover:tw-no-underline",
      "disabled:tw-bg-secondary-100",
      "disabled:tw-border-secondary-100",
      "disabled:!tw-text-main",
      "focus:tw-outline-none",
      "focus:tw-ring",
      "focus:tw-ring-offset-2",
      "focus:tw-ring-primary-700",
      "focus:tw-z-10",

      "tw-border-primary-500",
      "!tw-text-contrast",
      "hover:tw-bg-primary-700",
      "hover:tw-border-primary-700",
      "focus:tw-bg-primary-700",
      "focus:tw-border-primary-700",

      "peer-checked:tw-bg-primary-500",
    ];
  }
}
