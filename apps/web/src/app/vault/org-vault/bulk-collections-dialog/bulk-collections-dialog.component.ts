import { DIALOG_DATA, DialogConfig, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";

import { DialogServiceAbstraction } from "@bitwarden/angular/services/dialog";
import { CollectionView } from "@bitwarden/common/vault/models/view/collection.view";

import { AccessSelectorModule } from "../../../admin-console/organizations/shared/components/access-selector";
import { SharedModule } from "../../../shared";

export interface BulkCollectionsDialogParams {
  organizationId: string;
  collections: CollectionView[];
}

export enum BulkCollectionsDialogResult {
  Saved = "saved",
  Canceled = "canceled",
}

@Component({
  imports: [SharedModule, AccessSelectorModule],
  selector: "app-bulk-collections-dialog",
  templateUrl: "bulk-collections-dialog.component.html",
  standalone: true,
})
export class BulkCollectionsDialogComponent implements OnInit {
  protected formGroup = this.formBuilder.group({});
  protected loading = true;

  protected numCollections: number;

  constructor(
    @Inject(DIALOG_DATA) private params: BulkCollectionsDialogParams,
    private dialogRef: DialogRef<BulkCollectionsDialogResult>,
    private formBuilder: FormBuilder
  ) {
    this.numCollections = this.params.collections.length;
  }

  ngOnInit() {
    this.loading = false;
  }

  submit = () => {
    this.dialogRef.close(BulkCollectionsDialogResult.Saved);
  };

  static open(
    dialogService: DialogServiceAbstraction,
    config: DialogConfig<BulkCollectionsDialogParams>
  ) {
    return dialogService.open<BulkCollectionsDialogResult, BulkCollectionsDialogParams>(
      BulkCollectionsDialogComponent,
      config
    );
  }
}
