import { Component, HostBinding, Input } from "@angular/core";

export type IconButtonStyle = "contrast" | "main" | "muted" | "primary" | "secondary" | "danger";

const styles: Record<IconButtonStyle, string[]> = {
  contrast: [
    "tw-bg-transparent",
    "!tw-text-contrast",
    "tw-border",
    "tw-border-transparent",
    "tw-border-solid",
    "hover:tw-bg-transparent-hover",
    "hover:tw-border-text-contrast",
    "focus:tw-ring-offset-primary-500",
    "focus:tw-ring-text-contrast",
    "disabled:hover:tw-bg-transparent",
    "disabled:hover:tw-border-transparent",
  ],
  main: [
    "tw-bg-transparent",
    "!tw-text-main",
    "tw-border",
    "tw-border-transparent",
    "tw-border-solid",
    "hover:tw-bg-transparent-hover",
    "hover:tw-border-text-main",
    "focus:tw-ring-text-main",
    "disabled:hover:tw-bg-transparent",
    "disabled:hover:tw-border-transparent",
  ],
  muted: [
    "tw-bg-transparent",
    "!tw-text-muted",
    "tw-border",
    "tw-border-transparent",
    "tw-border-solid",
    "hover:tw-bg-transparent-hover",
    "hover:tw-border-primary-700",
    "focus:tw-ring-primary-700",
    "disabled:hover:tw-bg-transparent",
    "disabled:hover:tw-border-transparent",
  ],
  primary: [
    "tw-bg-primary-500",
    "!tw-text-contrast",
    "tw-border",
    "tw-border-primary-500",
    "tw-border-solid",
    "hover:tw-bg-primary-700",
    "focus:tw-ring-primary-700",
    "disabled:hover:tw-bg-primary-500",
    "disabled:hover:tw-border-transparent",
  ],
  secondary: [
    "tw-bg-transparent",
    "!tw-text-muted",
    "tw-border",
    "tw-border-text-muted",
    "tw-border-solid",
    "hover:!tw-text-contrast",
    "hover:tw-bg-text-muted",
    "focus:tw-ring-primary-700",
    "disabled:hover:tw-bg-transparent",
    "disabled:hover:!tw-text-muted",
    "disabled:hover:tw-border-text-muted",
    "disabled:hover:tw-border-transparent",
  ],
  danger: [
    "tw-bg-transparent",
    "!tw-text-danger",
    "tw-border",
    "tw-border-danger-500",
    "tw-border-solid",
    "hover:!tw-text-contrast",
    "hover:tw-bg-danger-500",
    "focus:tw-ring-primary-700",
    "disabled:hover:tw-bg-transparent",
    "disabled:hover:!tw-text-danger",
    "disabled:hover:tw-border-danger-500",
    "disabled:hover:tw-border-transparent",
  ],
};

export type IconButtonSize = "base" | "xl" | "2xl" | "default";

const sizes: Record<IconButtonSize, string[]> = {
  base: ["tw-text-base"],
  xl: ["tw-text-xl"],
  "2xl": ["tw-text-2xl"],
  default: [],
};

@Component({
  selector: "button[bitIconButton]",
  template: `<i class="bwi" [ngClass]="icon"></i>`,
})
export class BitIconButtonComponent {
  @Input("bitIconButton") icon: string;

  @Input() style: IconButtonStyle = "main";

  @Input() size: IconButtonSize = "default";

  @HostBinding("class") get classList() {
    return [
      "tw-font-semibold",
      "tw-py-1.5",
      "tw-px-3",
      "tw-rounded",
      "tw-transition",
      "tw-text-center",
      "tw-alt-focus-ring",
      "hover:tw-no-underline",
      "disabled:tw-opacity-60",
      "focus:tw-outline-none",
      // "tw-ring-offset-2",
      "focus:tw-z-10",
    ]
      .concat(styles[this.style])
      .concat(sizes[this.size]);
  }
}
