import { Component, HostBinding, Input } from "@angular/core";

export type IconButtonStyle = "contrast" | "main" | "muted" | "primary" | "secondary" | "danger";

@Component({
  selector: "button[bitIconButton]",
  template: `<i class="bwi" [ngClass]="icon"></i>`,
})
export class BitIconButtonComponent {
  @Input("bitIconButton") icon: string;

  @Input() style: IconButtonStyle = "contrast";

  @HostBinding("class") classList = [
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

    // primary
    "tw-border-primary-500",
    "tw-bg-primary-500",
    "!tw-text-contrast",
    "hover:tw-bg-primary-700",
    "hover:tw-border-primary-700",
    "focus:tw-bg-primary-700",
    "focus:tw-border-primary-700",
  ];

  // @HostBinding("innerHtml")
  // protected get innerHtml() {
  //   const svg = IconSvg[this.icon];
  //   if (svg == null) {
  //     return "Unknown icon";
  //   }
  //   return this.domSanitizer.bypassSecurityTrustHtml(IconSvg[this.icon]);
  // }
}
