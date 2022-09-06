import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";

@Component({
  selector: "app-collection-edit-dialog",
  templateUrl: "collection-edit-dialog.component.html",
})
export class CollectionEditDialogComponent {
  constructor(public dialogRef: DialogRef, @Inject(DIALOG_DATA) private data: unknown) {}

  // get animal() {
  //   // return this.data?.animal;
  // }
}
