import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { FormBuilder } from "@angular/forms";

export interface CollectionEditDialogParams {
  collectionId: string;
}

@Component({
  selector: "app-collection-edit-dialog",
  templateUrl: "collection-edit-dialog.component.html",
})
export class CollectionEditDialogComponent {
  formGroup = this.formBuilder.group({
    name: "",
    externalId: "",
    parent,
  });

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: DialogRef,
    @Inject(DIALOG_DATA) private params: CollectionEditDialogParams
  ) {}

  get collectionId() {
    return this.params.collectionId;
  }

  submit() {
    throw new Error("Not implemented");
  }
}
