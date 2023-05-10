import { Component, Input } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

import { Icon, isIcon } from "./icon";
import { IconKey } from "./types";

@Component({
  selector: "bit-icon",
  template: `
    <div *ngIf="safeHtml" [outerHTML]="safeHtml"></div>
    <svg
      *ngIf="!safeHtml"
      class="tw-relative tw-top-[.125em] tw-h-[1em] tw-w-[calc(18em/14)] tw-fill-current tw-align-baseline"
    >
      <use [attr.xlink:href]="'images/icons/symbol-defs.svg#icon-' + name"></use>
    </svg>
  `,
})
export class BitIconComponent {
  /**
   * Reference a Bitwarden icon by its name, e.g. "caret-up"
   *
   * Do not prefix with "bwi-"
   */
  @Input()
  name: IconKey;

  /** Use a custom SVG icon */
  @Input() set icon(icon: Icon) {
    if (!isIcon(icon)) {
      this.safeHtml = "";
      return;
    }

    const svg = icon.svg;
    this.safeHtml = this.domSanitizer.bypassSecurityTrustHtml(svg);
  }

  protected safeHtml: SafeHtml;

  constructor(private domSanitizer: DomSanitizer) {}
}
