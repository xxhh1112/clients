import { Input, HostBinding, Component } from "@angular/core";

export type ButtonGroupTypes = "primary";

const styles: Record<ButtonGroupTypes, string[]> = {
  primary: [
    "tw-border-primary-500",
    "tw-bg-primary-500",
    "!tw-text-contrast",
    "hover:tw-bg-primary-700",
    "hover:tw-border-primary-700",
    "focus:tw-bg-primary-700",
    "focus:tw-border-primary-700",
  ],
};

@Component({
  selector: "bit-button-group",
  templateUrl: "./button-group.component.html",
  host: {
    class: "",
  },
})
export class ButtonGroupComponent {
  @HostBinding("class") get classList() {
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
    ]
      .concat(this.block ? ["tw-w-full", "tw-block"] : ["tw-inline-block"])
      .concat(styles[this.type] ?? []);
  }

  @Input()
  type: ButtonGroupTypes = "primary";

  @Input()
  block = false;
}
