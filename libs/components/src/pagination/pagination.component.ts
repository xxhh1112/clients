import { ChangeDetectorRef, Component, ElementRef, Input, NgZone, OnDestroy } from "@angular/core";
import { ActivatedRoute, Params, Router, RouterModule } from "@angular/router";
import { map } from "rxjs";

import { MemoPipe } from "@bitwarden/angular/platform/pipes/memo.pipe";
import { RangePipe } from "@bitwarden/angular/platform/pipes/range.pipe";

import { ButtonModule } from "../button";
import { SharedModule } from "../shared";

@Component({
  selector: "bit-pagination",
  standalone: true,
  templateUrl: "pagination.component.html",
  imports: [SharedModule, RouterModule, ButtonModule, MemoPipe, RangePipe],
})
export class BitPaginationComponent implements OnDestroy {
  /** The query parameter key that conveys the current page, indexed by 1 */
  @Input() queryParam = "page";

  @Input() totalPages = 1;

  protected currPage$ = this.route.queryParams.pipe(
    map((params) => parseInt(params[this.queryParam]) || 1)
  );

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private elementRef: ElementRef,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.router.navigate([], {
      queryParams: {
        [this.queryParam]: null,
      },
      queryParamsHandling: "merge",
    });
  }

  protected getParams = (queryParamId: string, pageNum: number): Params => {
    return {
      [queryParamId]: pageNum,
    };
  };

  protected getGrouping(totalPages: number, pageNum: number) {
    if (totalPages > 7) {
      return "inner";
    }
    if (totalPages === 1) {
      return "none";
    }
    if (pageNum === 1 && pageNum !== totalPages) {
      return "first";
    }
    if (pageNum === totalPages) {
      return "last";
    }
    return "inner";
  }

  /**
   * Maintain focus position after rerendering
   */
  protected focusCurrentOnClick() {
    /**
     * Timeout is necessary to focus the element after change detection has run.
     */
    setTimeout(() => {
      const el = this.elementRef.nativeElement as HTMLElement;
      el.querySelector<HTMLAnchorElement>('a[aria-current="true"]')?.focus();
    }, 0);
  }
}
