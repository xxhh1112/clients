import { DIALOG_DATA, DialogConfig, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject, OnDestroy } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { combineLatest, of, Subject, switchMap, takeUntil } from "rxjs";

import { DialogServiceAbstraction } from "@bitwarden/angular/services/dialog";
import { OrganizationUserService } from "@bitwarden/common/abstractions/organization-user/organization-user.service";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { CollectionView } from "@bitwarden/common/vault/models/view/collection.view";

import { GroupService, GroupView } from "../../../admin-console/organizations/core";
import {
  AccessItemValue,
  AccessItemView,
  AccessSelectorModule,
  mapGroupToAccessItemView,
  mapUserToAccessItemView,
  PermissionMode,
} from "../../../admin-console/organizations/shared/components/access-selector";
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
export class BulkCollectionsDialogComponent implements OnDestroy {
  protected readonly PermissionMode = PermissionMode;

  protected formGroup = this.formBuilder.group({
    access: [[] as AccessItemValue[]],
  });
  protected loading = true;
  protected organization: Organization;
  protected accessItems: AccessItemView[] = [];
  protected numCollections: number;

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(DIALOG_DATA) private params: BulkCollectionsDialogParams,
    private dialogRef: DialogRef<BulkCollectionsDialogResult>,
    private formBuilder: FormBuilder,
    private organizationService: OrganizationService,
    private groupService: GroupService,
    private organizationUserService: OrganizationUserService
  ) {
    this.numCollections = this.params.collections.length;
    const organization$ = this.organizationService.get$(this.params.organizationId);
    const groups$ = organization$.pipe(
      switchMap((organization) => {
        if (!organization.useGroups) {
          return of([] as GroupView[]);
        }
        return this.groupService.getAll(organization.id);
      })
    );

    combineLatest([
      organization$,
      groups$,
      this.organizationUserService.getAllUsers(this.params.organizationId),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([organization, groups, users]) => {
        this.organization = organization;

        this.accessItems = [].concat(
          groups.map(mapGroupToAccessItemView),
          users.data.map(mapUserToAccessItemView)
        );

        this.loading = false;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
