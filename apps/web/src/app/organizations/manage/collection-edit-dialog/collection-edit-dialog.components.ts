import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, OnDestroy } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { of, switchMap, takeUntil, Subject } from "rxjs";

import { CollectionAdminService } from "@bitwarden/common/abstractions/collection/collection-admin.service.abstraction";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { CollectionAdminView } from "@bitwarden/common/models/view/collection-admin-view";
import { CollectionView } from "@bitwarden/common/models/view/collectionView";
import { BitValidators } from "@bitwarden/components";

export interface CollectionEditDialogParams {
  collectionId?: string;
  organizationId: string;
}

export enum CollectionEditDialogResultType {
  Saved,
  Canceled,
  Deleted,
}

export interface CollectionEditDialogResult {
  type: CollectionEditDialogResultType;
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
    parent: null as string | null,
  });

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: DialogRef,
    @Inject(DIALOG_DATA) private params: CollectionEditDialogParams,
    private collectionService: CollectionAdminService,
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService
  ) {
    of(0)
      .pipe(
        switchMap(() => collectionService.getAll(params.organizationId)),
        takeUntil(this.destroy$)
      )
      .subscribe((collections) => {
        if (params.collectionId) {
          this.collection = collections.find((c) => c.id === this.collectionId);
          this.nestOptions = collections.filter((c) => c.id !== this.collectionId);

          if (!this.collection) {
            throw new Error("Could not find collection to edit.");
          }

          const nameParts = this.collection.name?.split("/");
          const name = nameParts[nameParts.length - 1];
          const parent = nameParts.length > 1 ? nameParts.slice(0, -1).join("/") : null;

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

  async submit() {
    if (this.formGroup.invalid) {
      return;
    }

    const collectionView = new CollectionAdminView();
    collectionView.id = this.params.collectionId;
    collectionView.organizationId = this.params.organizationId;
    collectionView.externalId = this.formGroup.controls.externalId.value;

    const parent = this.formGroup.controls.parent.value;
    if (parent) {
      collectionView.name = `${parent}/${this.formGroup.controls.name.value}`;
    } else {
      collectionView.name = this.formGroup.controls.name.value;
    }

    await this.collectionService.save(collectionView);

    this.close({ type: CollectionEditDialogResultType.Saved });
  }

  async remove() {
    const confirmed = await this.platformUtilsService.showDialog(
      this.i18nService.t("deleteCollectionConfirmation"),
      this.collection?.name,
      this.i18nService.t("yes"),
      this.i18nService.t("no"),
      "warning"
    );

    if (!confirmed && this.params.collectionId) {
      return false;
    }

    await this.collectionService.remove(this.params.organizationId, this.params.collectionId);

    this.close({ type: CollectionEditDialogResultType.Deleted });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private close(result: CollectionEditDialogResult) {
    this.dialogRef.close(result);
  }
}
