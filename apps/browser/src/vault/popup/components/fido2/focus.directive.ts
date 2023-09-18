import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from "@angular/core";

@Directive({
  selector: "[appFocusOnLoad]",
})
export class FocusOnLoadDirective implements OnChanges {
  @Input() appFocusOnLoad: boolean;
  @Input() isSearching?: boolean = false;

  constructor(private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.appFocusOnLoad && !this.isSearching) {
      setTimeout(() => {
        this.el.nativeElement.focus();
      }, 500);
    }
  }
}
