import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, OnDestroy } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { of, switchMap, takeUntil, Subject } from "rxjs";

import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { CollectionView } from "@bitwarden/common/models/view/collectionView";

export interface CollectionEditDialogParams {
  collectionId: string;
}

@Component({
  selector: "app-collection-edit-dialog",
  templateUrl: "collection-edit-dialog.component.html",
})
export class CollectionEditDialogComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  loading = true;
  collectionView?: CollectionView;
  formGroup = this.formBuilder.group({
    name: ["", Validators.pattern(/^[^/]+$/)],
    externalId: "",
    parent: "",
  });

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: DialogRef,
    @Inject(DIALOG_DATA) private params: CollectionEditDialogParams,
    collectionService: CollectionService
  ) {
    if (this.params.collectionId) {
      of(0)
        .pipe(
          switchMap(async () => {
            const collection = await collectionService.get(params.collectionId);
            const [view] = await collectionService.decryptMany([collection]);
            return view;
          }),
          takeUntil(this.destroy$)
        )
        .subscribe((view) => {
          this.collectionView = view;
          this.formGroup.patchValue({
            name: view.name,
            externalId: view.externalId,
            parent: "",
          });
          this.loading = false;
        });
    } else {
      this.collectionView = new CollectionView();
    }
  }

  get collectionId() {
    return this.params.collectionId;
  }

  submit() {
    throw new Error("Not implemented");
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
