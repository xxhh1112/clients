import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Params, RouterLink } from "@angular/router";

import { MemoPipe } from "@bitwarden/angular/platform/pipes/memo.pipe";
import { RangePipe } from "@bitwarden/angular/platform/pipes/range.pipe";

import { ButtonModule } from "../button";
import { SharedModule } from "../shared";

@Component({
  selector: "bit-pagination",
  standalone: true,
  templateUrl: "pagination.component.html",
  imports: [SharedModule, RouterLink, ButtonModule, MemoPipe, RangePipe],
})
export class BitPaginationComponent {
  @Input() queryParamId = "page";

  /** The total number of pages. */
  @Input() totalPages = 1;

  private _page = 1;
  /** The current page number, indexed by 1. */
  @Input()
  set page(value: number) {
    this._page = clamp(value, 1, this.totalPages);
    this.pageChange.emit(this._page);
  }
  get page(): number {
    return this._page;
  }

  @Output() pageChange = new EventEmitter<number>();

  incPage() {
    this.page += 1;
  }

  decPage() {
    this.page -= 1;
  }

  getParams = (queryParamId: string, page: number): Params => {
    return {
      [queryParamId]: page,
    };
  };
}

const clamp = (input: number, min: number, max: number) => Math.min(Math.max(input, min), max);
