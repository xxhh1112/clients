import { Input, HostBinding, Component } from "@angular/core";

import { ButtonLikeAbstraction } from "../shared/button-like.abstraction";

export type ButtonTypes = "primary" | "secondary" | "danger";

const buttonStyles: Record<ButtonTypes, string[]> = {
  primary: [
    "tw-border-primary-500",
    "tw-bg-primary-500",
    "!tw-text-contrast",
    "hover:tw-bg-primary-700",
    "hover:tw-border-primary-700",
    "disabled:tw-border-primary-500",
    "disabled:tw-bg-clip-padding",
    "disabled:hover:tw-bg-primary-500",
  ],
  secondary: [
    "tw-bg-transparent",
    "tw-border-text-muted",
    "!tw-text-muted",
    "hover:tw-bg-secondary-500",
    "hover:tw-border-secondary-500",
    "hover:!tw-text-contrast",
    "disabled:tw-border-text-muted",
    "disabled:!tw-text-muted",
    "disabled:hover:tw-bg-transparent",
  ],
  danger: [
    "tw-bg-transparent",
    "tw-border-danger-500",
    "!tw-text-danger",
    "hover:tw-bg-danger-500",
    "hover:tw-border-danger-500",
    "hover:!tw-text-contrast",
    "disabled:tw-border-danger-500",
    "disabled:!tw-text-danger",
    "disabled:hover:tw-bg-transparent",
  ],
};

@Component({
  selector: "button[bitButton], a[bitButton]",
  templateUrl: "button.component.html",
  providers: [{ provide: ButtonLikeAbstraction, useExisting: ButtonComponent }],
})
export class ButtonComponent implements ButtonLikeAbstraction {
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
      "focus:tw-outline-none",
      "focus-visible:tw-ring",
      "focus-visible:tw-ring-offset-2",
      "focus-visible:tw-ring-primary-700",
      "focus-visible:tw-z-10",
      "disabled:tw-opacity-60",
    ]
      .concat(
        this.block == null || this.block === false ? ["tw-inline-block"] : ["tw-w-full", "tw-block"]
      )
      .concat(buttonStyles[this.buttonType ?? "secondary"]);
  }

  @HostBinding("attr.disabled")
  get disabledAttr() {
    const disabled = this.disabled != null && this.disabled !== false;
    return disabled || this.loading ? true : null;
  }

  @Input() buttonType: ButtonTypes = null;
  @Input() block?: boolean;
  @Input() loading = false;
  @Input() disabled = false;

  setButtonType(value: "primary" | "secondary" | "danger") {
    this.buttonType = value;
  }
}
