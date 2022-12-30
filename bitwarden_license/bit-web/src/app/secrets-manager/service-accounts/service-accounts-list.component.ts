import { SelectionModel } from "@angular/cdk/collections";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

import { ServiceAccountView } from "../models/view/service-account.view";

@UntilDestroy()
@Component({
  selector: "sm-service-accounts-list",
  templateUrl: "./service-accounts-list.component.html",
})
export class ServiceAccountsListComponent {
  @Input()
  get serviceAccounts(): ServiceAccountView[] {
    return this._serviceAccounts;
  }
  set serviceAccounts(serviceAccounts: ServiceAccountView[]) {
    this.selection.clear();
    this._serviceAccounts = serviceAccounts;
  }
  private _serviceAccounts: ServiceAccountView[];

  @Output() newServiceAccountEvent = new EventEmitter();
  @Output() deleteServiceAccountsEvent = new EventEmitter<string[]>();
  @Output() onServiceAccountCheckedEvent = new EventEmitter<string[]>();

  selection = new SelectionModel<string>(true, []);

  constructor() {
    this.selection.changed
      .pipe(untilDestroyed(this))
      .subscribe((_) => this.onServiceAccountCheckedEvent.emit(this.selection.selected));
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.serviceAccounts.length;
    return numSelected === numRows;
  }

  toggleAll() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.selection.select(...this.serviceAccounts.map((s) => s.id));
  }

  bulkDeleteServiceAccounts() {
    if (this.selection.selected.length >= 1) {
      this.deleteServiceAccountsEvent.emit(this.selection.selected);
    }
  }
}
