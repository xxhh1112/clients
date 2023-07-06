import { isDataSource } from "@angular/cdk/collections";
import {
  AfterContentChecked,
  Component,
  ContentChild,
  Directive,
  Input,
  OnDestroy,
  TemplateRef,
} from "@angular/core";
import { BehaviorSubject, Observable, combineLatest, map } from "rxjs";

import { TableDataSource } from "./table-data-source";

@Directive({
  selector: "ng-template[body]",
})
export class TableBodyDirective {
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  constructor(public readonly template: TemplateRef<any>) {}
}

@Component({
  selector: "bit-table",
  templateUrl: "./table.component.html",
})
export class TableComponent implements OnDestroy, AfterContentChecked {
  @Input() dataSource: TableDataSource<any>;
  @Input() layout: "auto" | "fixed" = "auto";

  /**
   * Table ID to pass to query params:
   *
   * `'my-table'` --> `?my-table-page-1`
   */
  @Input() paginated: string;

  @ContentChild(TableBodyDirective) templateVariable: TableBodyDirective;

  protected pages$: Observable<any[][]>;
  protected page$ = new BehaviorSubject(1);
  private readonly _pageSize = 10;
  private readonly _pageThreshold = 5;

  protected rows$: Observable<readonly any[]>;

  private _initialized = false;

  get tableClass() {
    return [
      "tw-w-full",
      "tw-leading-normal",
      "tw-text-main",
      this.layout === "auto" ? "tw-table-auto" : "tw-table-fixed",
    ];
  }

  ngAfterContentChecked(): void {
    if (!this._initialized && isDataSource(this.dataSource)) {
      this._initialized = true;

      this.pages$ = this.dataSource.connect().pipe(paginate(this._pageSize, this._pageThreshold));

      this.rows$ = combineLatest([this.pages$, this.page$]).pipe(
        map(([pages, page]) => pages[page - 1])
      );
    }
  }

  ngOnDestroy(): void {
    if (isDataSource(this.dataSource)) {
      this.dataSource.disconnect();
    }
  }
}

const paginate = <T>(pageSize: number, pageThreshhold: number) => {
  return map((data: T[]) => {
    const pages: T[][] = [];
    for (let i = 0; i < data.length; i = i + pageSize) {
      const slice = data.slice(i, i + pageSize);
      if (slice.length < pageThreshhold) {
        // Append to the previous page
        const idx = pages.length - 1;
        pages[idx] = pages[idx].concat(slice);
      } else {
        // Add new page
        pages.push(slice);
      }
    }
    return pages;
  });
};
