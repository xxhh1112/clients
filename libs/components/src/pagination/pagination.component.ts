import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { ActivatedRoute, Params, Router, RouterModule } from "@angular/router";
import { Subject, map, takeUntil } from "rxjs";

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
export class BitPaginationComponent implements OnInit, OnDestroy {
  private _destroy$ = new Subject<void>();

  /** The query parameter key that conveys the current page, indexed by 1 */
  @Input() queryParam = "page";

  @Input() totalPages = 1;

  @Output() pageChange = new EventEmitter<number>();

  protected currPage$ = this.route.queryParams.pipe(
    map((params) => clamp(parseInt(params[this.queryParam]) || 1, 1, this.totalPages))
  );

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.currPage$.pipe(takeUntil(this._destroy$)).subscribe((page) => {
      this.pageChange.emit(page);
    });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();

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

const clamp = (input: number, min: number, max: number) => Math.min(Math.max(input, min), max);
