import { Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from "@angular/core";

@Component({
  selector: "bit-popover",
  templateUrl: "./popover.component.html",
  exportAs: "popoverComponent",
})
export class PopoverComponent {
  @ViewChild(TemplateRef) templateRef: TemplateRef<any>;
  @Input() header = "";
  @Output() closed = new EventEmitter();
}
