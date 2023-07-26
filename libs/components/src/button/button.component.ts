import { coerceBooleanProperty } from "@angular/cdk/coercion";
import { Input, HostBinding, Component } from "@angular/core";

// import { ButtonGroupings } from "../button-group/button-group.component";
import {
  ButtonGroupings,
  ButtonLikeAbstraction,
  ButtonType,
} from "../shared/button-like.abstraction";

const focusRing = [
  "focus-visible:tw-ring",
  "focus-visible:tw-ring-offset-2",
  "focus-visible:tw-ring-primary-700",
  "focus-visible:tw-z-10",
];

const baseButtonGroupStyles = ["grouped", "focus-visible:tw-ring-inset", "tw-relative"];
const buttonGroupStyles: Record<ButtonGroupings, string[]> = {
  none: ["tw-rounded"],
  first: [...baseButtonGroupStyles, "tw-rounded-l", "tw-rounded-r-none"],
  last: [...baseButtonGroupStyles, "tw-rounded-r", "tw-rounded-l-none", "tw-ml-[-1px]"],
  inner: [...baseButtonGroupStyles, "tw-rounded-none", "tw-ml-[-1px]"],
};

const buttonStyles: Record<ButtonType, string[]> = {
  primary: [
    "tw-border-primary-500",
    "tw-bg-primary-500",
    "!tw-text-contrast",
    "hover:tw-bg-primary-700",
    "hover:tw-border-primary-700",
    "disabled:tw-bg-primary-500/60",
    "disabled:tw-border-primary-500/60",
    "disabled:!tw-text-contrast/60",
    "disabled:tw-bg-clip-padding",
    "disabled:tw-cursor-not-allowed",
    ...focusRing,
  ],
  secondary: [
    "tw-bg-transparent",
    "tw-border-text-muted",
    "!tw-text-muted",
    "hover:tw-bg-text-muted",
    "hover:tw-border-text-muted",
    "hover:!tw-text-contrast",
    "disabled:tw-bg-transparent",
    "disabled:tw-border-text-muted/60",
    "disabled:!tw-text-muted/60",
    "disabled:tw-cursor-not-allowed",
    ...focusRing,
  ],
  danger: [
    "tw-bg-transparent",
    "tw-border-danger-500",
    "!tw-text-danger",
    "hover:tw-bg-danger-500",
    "hover:tw-border-danger-500",
    "hover:!tw-text-contrast",
    "disabled:tw-bg-transparent",
    "disabled:tw-border-danger-500/60",
    "disabled:!tw-text-danger/60",
    "disabled:tw-cursor-not-allowed",
    ...focusRing,
  ],
  unstyled: [],
};

@Component({
  selector: "button[bitButton], a[bitButton]",
  templateUrl: "button.component.html",
  providers: [{ provide: ButtonLikeAbstraction, useExisting: ButtonComponent }],
})
export class ButtonComponent implements ButtonLikeAbstraction {
  @HostBinding("class") get classList(): string[] {
    return [
      "tw-font-semibold",
      "tw-py-1.5",
      "tw-px-3",
      "tw-transition",
      "tw-border",
      "tw-border-solid",
      "tw-text-center",
      "hover:tw-no-underline",
      "focus:tw-outline-none",
      this.block ? ["tw-w-full", "tw-block"] : ["tw-inline-block"],
      buttonStyles[this.buttonType ?? "secondary"],
      buttonGroupStyles[this.grouping ?? "none"],
    ].flat();
  }

  @HostBinding("attr.disabled")
  get disabledAttr() {
    const disabled = this.disabled != null && this.disabled !== false;
    return disabled || this.loading ? true : null;
  }

  @Input() buttonType: ButtonType;

  @Input() grouping: ButtonGroupings = "none";

  private _block = false;

  @Input()
  get block(): boolean {
    return this._block;
  }

  set block(value: boolean | "") {
    this._block = coerceBooleanProperty(value);
  }

  @Input() loading = false;

  @Input() disabled = false;

  setButtonType(value: "primary" | "secondary" | "danger" | "unstyled") {
    this.buttonType = value;
  }
}
