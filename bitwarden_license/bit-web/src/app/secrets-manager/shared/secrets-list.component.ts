import { SelectionModel } from "@angular/cdk/collections";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

import { SecretListView } from "../models/view/secret-list.view";

@UntilDestroy()
@Component({
  selector: "sm-secrets-list",
  templateUrl: "./secrets-list.component.html",
})
export class SecretsListComponent {
  @Input()
  get secrets(): SecretListView[] {
    return this._secrets;
  }
  set secrets(secrets: SecretListView[]) {
    this.selection.clear();
    this._secrets = secrets;
  }
  private _secrets: SecretListView[];

  @Output() editSecretEvent = new EventEmitter<string>();
  @Output() copySecretNameEvent = new EventEmitter<string>();
  @Output() copySecretValueEvent = new EventEmitter<string>();
  @Output() projectsEvent = new EventEmitter<string>();
  @Output() onSecretCheckedEvent = new EventEmitter<string[]>();
  @Output() deleteSecretsEvent = new EventEmitter<string[]>();
  @Output() newSecretEvent = new EventEmitter();

  selection = new SelectionModel<string>(true, []);

  constructor() {
    this.selection.changed
      .pipe(untilDestroyed(this))
      .subscribe((_) => this.onSecretCheckedEvent.emit(this.selection.selected));
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.secrets.length;
    return numSelected === numRows;
  }

  toggleAll() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.selection.select(...this.secrets.map((s) => s.id));
  }

  bulkDeleteSecrets() {
    if (this.selection.selected.length >= 1) {
      this.deleteSecretsEvent.emit(this.selection.selected);
    }
  }
}
