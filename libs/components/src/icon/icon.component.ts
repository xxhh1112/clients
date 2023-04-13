import { Component, Input } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

import { Icon, isIcon } from "./icon";

@Component({
  selector: "bit-icon",
  template: `
    <div *ngIf="safeHtml" [outerHTML]="safeHtml"></div>
    <svg *ngIf="!safeHtml" class="tw-h-[1em] tw-w-[1em] tw-fill-current tw-align-baseline">
      <use [attr.xlink:href]="'#icon-' + _name"></use>
    </svg>
  `,
})
export class BitIconComponent {
  protected _name: string;
  @Input()
  set name(name: string) {
    this._name = name;
    if (!document.querySelector(`symbol#icon-${name}`)) {
      // eslint-disable-next-line
      console.error(`Cannot find icon: ${name}`);
    }
  }

  @Input() set icon(src: Icon) {
    if (!isIcon(src)) {
      this.safeHtml = "";
      // TODO set this.name of fallback icon
      return;
    }

    const svg = src.svg;
    this.safeHtml = this.domSanitizer.bypassSecurityTrustHtml(svg);
  }

  protected safeHtml: SafeHtml;

  constructor(private domSanitizer: DomSanitizer) {}
}
