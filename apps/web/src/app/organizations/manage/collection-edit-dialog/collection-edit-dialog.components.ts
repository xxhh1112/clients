import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, OnDestroy } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { of, switchMap, takeUntil, Subject } from "rxjs";

import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { CollectionView } from "@bitwarden/common/models/view/collectionView";
import { BitValidators } from "@bitwarden/components";

export interface CollectionEditDialogParams {
  collectionId: string;
}

@Component({
  selector: "app-collection-edit-dialog",
  templateUrl: "collection-edit-dialog.component.html",
})
export class CollectionEditDialogComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  collection?: CollectionView;
  nestOptions: CollectionView[] = [];
  formGroup = this.formBuilder.group({
    name: ["", BitValidators.forbiddenCharacters(["/"])],
    externalId: "",
    parent: "",
  });

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: DialogRef,
    @Inject(DIALOG_DATA) private params: CollectionEditDialogParams,
    collectionService: CollectionService
  ) {
    of(0)
      .pipe(
        switchMap(() => collectionService.getAllDecrypted()),
        takeUntil(this.destroy$)
      )
      .subscribe((collections) => {
        if (params.collectionId) {
          this.collection = collections.find((c) => c.id === this.collectionId);
          this.nestOptions = collections.filter((c) => c.id !== this.collectionId);

          if (!this.collection) {
            throw new Error("Could not find collection to edit.");
          }

          const nameParts = this.collection.name.split("/");
          const name = nameParts[nameParts.length - 1];
          const parent = nameParts.length > 1 ? nameParts.slice(0, -1).join("/") : undefined;

          this.formGroup.patchValue({
            name,
            externalId: this.collection.externalId,
            parent,
          });
        } else {
          this.nestOptions = collections;
        }
      });
  }

  get collectionId() {
    return this.params.collectionId;
  }

  get loading() {
    return this.params.collectionId && !this.collection;
  }

  submit() {
    throw new Error("Not implemented");
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
