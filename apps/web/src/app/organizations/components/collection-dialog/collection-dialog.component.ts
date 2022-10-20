import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { takeUntil, Subject, forkJoin, of } from "rxjs";

import { CollectionAdminService } from "@bitwarden/common/abstractions/collection/collection-admin.service.abstraction";
import { GroupServiceAbstraction } from "@bitwarden/common/abstractions/group/group.service.abstraction";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { OrganizationService } from "@bitwarden/common/abstractions/organization/organization.service.abstraction";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { CollectionAdminView } from "@bitwarden/common/models/view/collection-admin-view";
import { CollectionView } from "@bitwarden/common/models/view/collectionView";
import { CollectionGroupSelectionView } from "@bitwarden/common/src/models/view/collection-group-selection-view";
import { BitValidators } from "@bitwarden/components";

import { AccessItemType, AccessItemView, CollectionPermission } from "../access-selector";

export interface CollectionEditDialogParams {
  collectionId?: string;
  organizationId: string;
}

export enum CollectionDialogResultType {
  Saved = "saved",
  Canceled = "canceled",
  Deleted = "deleted",
}

export interface CollectionDialogResult {
  type: CollectionDialogResultType;
}

@Component({
  selector: "app-collection-dialog",
  templateUrl: "collection-dialog.component.html",
})
export class CollectionDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  test: any = [];
  collection?: CollectionView;
  nestOptions: CollectionView[] = [];
  accessItems: AccessItemView[] = [];
  formGroup = this.formBuilder.group({
    name: ["", BitValidators.forbiddenCharacters(["/"])],
    externalId: "",
    parent: null as string | null,
    access: [[] as AccessItemView[]],
  });

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: DialogRef,
    @Inject(DIALOG_DATA) private params: CollectionEditDialogParams,
    private organizationService: OrganizationService,
    private groupService: GroupServiceAbstraction,
    private collectionService: CollectionAdminService,
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService
  ) {}

  ngOnInit() {
    forkJoin({
      organization: of(this.organizationService.get(this.params.organizationId)),
      collections: this.collectionService.getAll(this.params.organizationId),
      collectionDetails: this.collectionService.get(
        this.params.organizationId,
        this.params.collectionId
      ),
      groups: this.groupService.getAll(this.params.organizationId),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ collections, collectionDetails, organization, groups }) => {
        if (this.params.collectionId) {
          this.collection = collections.find((c) => c.id === this.collectionId);
          this.nestOptions = collections.filter((c) => c.id !== this.collectionId);

          if (!this.collection) {
            throw new Error("Could not find collection to edit.");
          }

          const nameParts = this.collection.name?.split("/");
          const name = nameParts[nameParts.length - 1];
          const parent = nameParts.length > 1 ? nameParts.slice(0, -1).join("/") : null;

          const selectionsById = new Map(collectionDetails.groups.map((g) => [g.id, g]));

          this.accessItems = [].concat(
            groups.map((group) => {
              if (group.accessAll) {
                return {
                  id: group.id,
                  type: AccessItemType.Group,
                  listName: group.name,
                  labelName: group.name,
                  accessAllItems: true,
                  readonly: true,
                } as AccessItemView;
              }

              const selection = selectionsById.get(group.id);
              if (selection == undefined) {
                return {
                  id: group.id,
                  type: AccessItemType.Group,
                  listName: group.name,
                  labelName: group.name,
                };
              }

              return {
                id: group.id,
                type: AccessItemType.Group,
                listName: group.name,
                labelName: group.name,
                accessAllItems: false,
                readonlyPermission: mapToCollectionPermission(selection),
              } as AccessItemView;
            })
          );

          this.formGroup.patchValue({
            name,
            externalId: this.collection.externalId,
            parent,
            access: this.accessItems.filter(
              (item) => item.accessAllItems || item.readonlyPermission != undefined
            ),
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

  async cancel() {
    this.close({ type: CollectionDialogResultType.Canceled });
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

    this.close({ type: CollectionDialogResultType.Saved });
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

    this.close({ type: CollectionDialogResultType.Deleted });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private close(result: CollectionDialogResult) {
    this.dialogRef.close(result);
  }
}

function mapToCollectionPermission(selection: CollectionGroupSelectionView): CollectionPermission {
  if (selection.readOnly && selection.hidePasswords) {
    return CollectionPermission.ViewExceptPass;
  }

  if (selection.readOnly && !selection.hidePasswords) {
    return CollectionPermission.View;
  }

  if (!selection.readOnly && selection.hidePasswords) {
    return CollectionPermission.EditExceptPass;
  }

  if (!selection.readOnly && !selection.hidePasswords) {
    return CollectionPermission.Edit;
  }
}
