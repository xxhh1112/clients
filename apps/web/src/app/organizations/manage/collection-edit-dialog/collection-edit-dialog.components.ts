import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";

export interface CollectionEditDialogParams {
  collectionId: string;
}

@Component({
  selector: "app-collection-edit-dialog",
  templateUrl: "collection-edit-dialog.component.html",
})
export class CollectionEditDialogComponent {
  constructor(
    public dialogRef: DialogRef,
    @Inject(DIALOG_DATA) private params: CollectionEditDialogParams
  ) {}

  get collectionId() {
    return this.params.collectionId;
  }
}
