import { Component, Input, OnDestroy } from "@angular/core";
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

  /** The total number of pages. */
  @Input() totalPages = 1;

  page$ = this.route.queryParams.pipe(map((params) => parseInt(params[this.queryParam]) || 1));

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnDestroy(): void {
    this.router.navigate([], {
      queryParams: {
        [this.queryParam]: null,
      },
      queryParamsHandling: "merge",
    });
  }

  protected getParams = (queryParamId: string, page: number): Params => {
    return {
      [queryParamId]: page,
    };
  };

  protected getButtonType = (n: number, page: number) => {
    if (n == page) {
      return "primary";
    }
    return "secondary";
  };

  protected getGrouping(totalPages: number, n: number) {
    if (totalPages > 7) {
      return "inner";
    }
    if (totalPages === 1) {
      return "none";
    }
    if (n === 1 && n !== totalPages) {
      return "first";
    }
    if (n === totalPages) {
      return "last";
    }
    return "inner";
  }
}

// const clamp = (input: number, min: number, max: number) => Math.min(Math.max(input, min), max);
