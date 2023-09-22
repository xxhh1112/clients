import { SelectionModel } from "@angular/cdk/collections";
import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, Input, OnInit } from "@angular/core";
import { Observable, map } from "rxjs";

import { CheckboxModule } from "../checkbox";
import { SharedModule } from "../shared/shared.module";

import { RowDirective } from "./row.directive";
import { TableComponent } from "./table.component";

@Component({
  selector: "th[bit-row-selector]",
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, SharedModule, CheckboxModule],
  template: `
    <label
      *ngIf="selection"
      class="!tw-mb-0 tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-select-none tw-items-center !tw-font-bold !tw-text-muted"
    >
      <div class="tw-min-w-max">
        <input
          type="checkbox"
          bitCheckbox
          (change)="$event ? toggleAll() : null"
          [checked]="checked$ | async"
          [indeterminate]="indeterminate$ | async"
          [disabled]="disabled || (dataIsEmpty$ | async)"
        />
        {{ "all" | i18n }}
      </div>
    </label>
  `,
})
export class HeaderRowSelectorComponent implements OnInit {
  protected selection: SelectionModel<unknown>;
  protected checked$: Observable<boolean>;
  protected indeterminate$: Observable<boolean>;
  protected dataIsEmpty$: Observable<boolean>;

  @Input() disabled = false;

  constructor(private table: TableComponent) {}

  ngOnInit(): void {
    this.selection = this.table.dataSource?.selectionModel;

    this.checked$ = this.selection.changed
      .asObservable()
      .pipe(map(() => this.selection.hasValue() && this.isAllSelected()));
    this.indeterminate$ = this.selection.changed
      .asObservable()
      .pipe(map(() => this.selection.hasValue() && !this.isAllSelected()));
    this.dataIsEmpty$ = this.table.dataSource.connect().pipe(map((data) => data.length === 0));
  }

  protected toggleAll() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.selection.select(...this.table.dataSource.filteredData);
    }
  }

  private isAllSelected() {
    if (this.selection.selected?.length > 0) {
      const numSelected = this.selection.selected.length;
      const numRows = this.table.dataSource.filteredData.length;
      return numSelected === numRows;
    }
    return false;
  }
}

@Component({
  selector: "td[bit-row-selector]",
  standalone: true,
  imports: [CommonModule, CheckboxModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label
      class="!tw-mb-0 tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-select-none tw-items-center"
    >
      <input
        bitCheckbox
        type="checkbox"
        (change)="$event ? toggle() : null"
        [checked]="isSelected | async"
        [disabled]="disabled"
      />
      <span class="sr-only">Select Row</span>
    </label>
  `,
})
export class RowSelectorComponent {
  @Input() disabled = false;

  protected selection: SelectionModel<unknown>;

  protected isSelected: Observable<boolean>;

  constructor(private table: TableComponent, private row: RowDirective) {}

  protected toggle() {
    this.selection.toggle(this.row.rowData);
  }

  ngOnInit(): void {
    this.selection = this.table.dataSource?.selectionModel;

    this.isSelected = this.selection.changed
      .asObservable()
      .pipe(map(() => this.selection.isSelected(this.row.rowData)));
  }
}
