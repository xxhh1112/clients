import { DIALOG_DATA, DialogConfig, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { combineLatest, of, shareReplay, Subject, switchMap, takeUntil } from "rxjs";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { OrganizationUserService } from "@bitwarden/common/abstractions/organization-user/organization-user.service";
import { OrganizationService } from "@bitwarden/common/abstractions/organization/organization.service.abstraction";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { OrganizationUserStatusType } from "@bitwarden/common/enums/organizationUserStatusType";
import { OrganizationUserType } from "@bitwarden/common/enums/organizationUserType";
import { PermissionsApi } from "@bitwarden/common/models/api/permissions.api";
import { Organization } from "@bitwarden/common/models/domain/organization";
import { CollectionView } from "@bitwarden/common/models/view/collection.view";
import { DialogService } from "@bitwarden/components";

import {
  CollectionAccessSelectionView,
  CollectionAdminService,
  GroupService,
  GroupView,
  OrganizationUserAdminView,
  UserAdminService,
} from "../../../core";
import {
  AccessItemType,
  AccessItemValue,
  AccessItemView,
  convertToPermission,
  convertToSelectionView,
  PermissionMode,
} from "../../../shared/components/access-selector";

export enum MemberDialogTab {
  Role = 0,
  Groups = 1,
  Collections = 2,
}

export interface MemberDialogParams {
  name: string;
  organizationId: string;
  organizationUserId: string;
  usesKeyConnector: boolean;
  initialTab?: MemberDialogTab;
}

export enum MemberDialogResult {
  Saved = "saved",
  Canceled = "canceled",
  Deleted = "deleted",
  Revoked = "revoked",
  Restored = "restored",
}

@Component({
  selector: "app-member-dialog",
  templateUrl: "member-dialog.component.html",
})
export class MemberDialogComponent implements OnInit, OnDestroy {
  loading = true;
  editMode = false;
  isRevoked = false;
  title: string;
  emails: string;
  type: OrganizationUserType = OrganizationUserType.User;
  permissions = new PermissionsApi();
  access: "all" | "selected" = "selected";
  collections: CollectionView[] = [];
  organizationUserType = OrganizationUserType;
  canUseCustomPermissions: boolean;
  PermissionMode = PermissionMode;

  protected organization: Organization;
  protected collectionAccessItems: AccessItemView[] = [];
  protected groupAccessItems: AccessItemView[] = [];
  protected tabIndex: MemberDialogTab;
  // Stub, to be filled out in upcoming PRs
  protected formGroup = this.formBuilder.group({
    accessAllCollections: false,
    access: [[] as AccessItemValue[]],
    groups: [[] as AccessItemValue[]],
  });

  private destroy$ = new Subject<void>();

  manageAllCollectionsCheckboxes = [
    {
      id: "createNewCollections",
      get: () => this.permissions.createNewCollections,
      set: (v: boolean) => (this.permissions.createNewCollections = v),
    },
    {
      id: "editAnyCollection",
      get: () => this.permissions.editAnyCollection,
      set: (v: boolean) => (this.permissions.editAnyCollection = v),
    },
    {
      id: "deleteAnyCollection",
      get: () => this.permissions.deleteAnyCollection,
      set: (v: boolean) => (this.permissions.deleteAnyCollection = v),
    },
  ];

  manageAssignedCollectionsCheckboxes = [
    {
      id: "editAssignedCollections",
      get: () => this.permissions.editAssignedCollections,
      set: (v: boolean) => (this.permissions.editAssignedCollections = v),
    },
    {
      id: "deleteAssignedCollections",
      get: () => this.permissions.deleteAssignedCollections,
      set: (v: boolean) => (this.permissions.deleteAssignedCollections = v),
    },
  ];

  get customUserTypeSelected(): boolean {
    return this.type === OrganizationUserType.Custom;
  }

  get accessAllCollections(): boolean {
    return this.formGroup.value.accessAllCollections;
  }

  constructor(
    @Inject(DIALOG_DATA) protected params: MemberDialogParams,
    private dialogRef: DialogRef<MemberDialogResult>,
    private apiService: ApiService,
    private i18nService: I18nService,
    private collectionService: CollectionService,
    private platformUtilsService: PlatformUtilsService,
    private organizationService: OrganizationService,
    private logService: LogService,
    private formBuilder: FormBuilder,
    // TODO: We should really look into consolidating naming conventions for these services
    private collectionAdminService: CollectionAdminService,
    private groupService: GroupService,
    private userService: UserAdminService,
    private organizationUserService: OrganizationUserService
  ) {}

  async ngOnInit() {
    this.editMode = this.loading = this.params.organizationUserId != null;
    this.tabIndex = this.params.initialTab ?? MemberDialogTab.Role;
    this.title = this.i18nService.t(this.editMode ? "editMember" : "inviteMember");

    const organization$ = of(this.organizationService.get(this.params.organizationId)).pipe(
      shareReplay({ refCount: true, bufferSize: 1 })
    );
    const groups$ = organization$.pipe(
      switchMap((organization) => {
        if (!organization.useGroups) {
          return of([] as GroupView[]);
        }

        return this.groupService.getAll(this.params.organizationId);
      })
    );

    combineLatest({
      organization: organization$,
      collections: this.collectionAdminService.getAll(this.params.organizationId),
      userDetails: this.params.organizationUserId
        ? this.userService.get(this.params.organizationId, this.params.organizationUserId)
        : of(null),
      groups: groups$,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ organization, collections, userDetails, groups }) => {
        this.organization = organization;
        this.canUseCustomPermissions = organization.useCustomPermissions;
        this.type = userDetails.type;
        this.isRevoked = userDetails.status === OrganizationUserStatusType.Revoked;

        if (userDetails.type === OrganizationUserType.Custom) {
          this.permissions = userDetails.permissions;
        }

        const collectionsFromGroups = groups
          .filter((group) => userDetails.groups.includes(group.id))
          .flatMap((group) =>
            group.collections.map((accessSelection) => {
              const collection = collections.find((c) => c.id === accessSelection.id);
              return { group, collection, accessSelection };
            })
          );
        this.collectionAccessItems = [].concat(
          collectionsFromGroups.map(({ collection, accessSelection, group }) =>
            mapCollectionToAccessItemView(collection, accessSelection, group)
          ),
          collections.map((c) => mapCollectionToAccessItemView(c))
        );

        this.groupAccessItems = [].concat(
          groups.map<AccessItemView>((g) => mapGroupToAccessItemView(g))
        );

        if (this.params.organizationUserId) {
          if (!userDetails) {
            throw new Error("Could not find user to edit.");
          }

          const accessSelections = mapToAccessSelections(userDetails);
          const groupAccessSelections = mapToGroupAccessSelections(userDetails.groups);
          this.formGroup.patchValue({
            accessAllCollections: userDetails.accessAll,
            access: accessSelections,
            groups: groupAccessSelections,
          });
        }

        this.loading = false;
      });
  }

  check(c: CollectionView, select?: boolean) {
    (c as any).checked = select == null ? !(c as any).checked : select;
    if (!(c as any).checked) {
      c.readOnly = false;
    }
  }

  selectAll(select: boolean) {
    this.collections.forEach((c) => this.check(c, select));
  }

  setRequestPermissions(p: PermissionsApi, clearPermissions: boolean) {
    Object.assign(p, clearPermissions ? new PermissionsApi() : this.permissions);
    return p;
  }

  handleDependentPermissions() {
    // Manage Password Reset must have Manage Users enabled
    if (this.permissions.manageResetPassword && !this.permissions.manageUsers) {
      this.permissions.manageUsers = true;
      (document.getElementById("manageUsers") as HTMLInputElement).checked = true;
      this.platformUtilsService.showToast(
        "info",
        null,
        this.i18nService.t("resetPasswordManageUsers")
      );
    }
  }

  submit = async () => {
    if (this.formGroup.invalid) {
      return;
    }

    if (!this.canUseCustomPermissions && this.type === OrganizationUserType.Custom) {
      this.platformUtilsService.showToast(
        "error",
        null,
        this.i18nService.t("customNonEnterpriseError")
      );
      return;
    }

    try {
      const userView = new OrganizationUserAdminView();
      userView.id = this.params.organizationUserId;
      userView.organizationId = this.params.organizationId;
      userView.accessAll = this.accessAllCollections;
      userView.type = this.type;
      userView.permissions = this.setRequestPermissions(
        userView.permissions ?? new PermissionsApi(),
        userView.type !== OrganizationUserType.Custom
      );
      userView.collections = this.formGroup.controls.access.value
        .filter((v) => v.type === AccessItemType.Collection)
        .map(convertToSelectionView);
      userView.groups = this.formGroup.controls.groups.value.map((m) => m.id);

      if (this.editMode) {
        await this.userService.save(userView);
      } else {
        userView.id = this.params.organizationUserId;
        const emails = [...new Set(this.emails.trim().split(/\s*,\s*/))];
        await this.userService.invite(emails, userView);
      }

      this.platformUtilsService.showToast(
        "success",
        null,
        this.i18nService.t(this.editMode ? "editedUserId" : "invitedUsers", this.params.name)
      );
      this.close(MemberDialogResult.Saved);
    } catch (e) {
      this.logService.error(e);
    }
  };

  delete = async () => {
    if (!this.editMode) {
      return;
    }

    const message = this.params.usesKeyConnector
      ? "removeUserConfirmationKeyConnector"
      : "removeOrgUserConfirmation";
    const confirmed = await this.platformUtilsService.showDialog(
      this.i18nService.t(message),
      this.i18nService.t("removeUserIdAccess", this.params.name),
      this.i18nService.t("yes"),
      this.i18nService.t("no"),
      "warning",
      false,
      "app-user-add-edit .modal-content"
    );
    if (!confirmed) {
      return false;
    }

    try {
      await this.organizationUserService.deleteOrganizationUser(
        this.params.organizationId,
        this.params.organizationUserId
      );

      this.platformUtilsService.showToast(
        "success",
        null,
        this.i18nService.t("removedUserId", this.params.name)
      );
      this.close(MemberDialogResult.Deleted);
    } catch (e) {
      this.logService.error(e);
    }
  };

  revoke = async () => {
    if (!this.editMode) {
      return;
    }

    const confirmed = await this.platformUtilsService.showDialog(
      this.i18nService.t("revokeUserConfirmation"),
      this.i18nService.t("revokeUserId", this.params.name),
      this.i18nService.t("revokeAccess"),
      this.i18nService.t("cancel"),
      "warning",
      false,
      "app-user-add-edit .modal-content"
    );
    if (!confirmed) {
      return false;
    }

    try {
      await this.organizationUserService.revokeOrganizationUser(
        this.params.organizationId,
        this.params.organizationUserId
      );

      this.platformUtilsService.showToast(
        "success",
        null,
        this.i18nService.t("revokedUserId", this.params.name)
      );
      this.isRevoked = true;
      this.close(MemberDialogResult.Revoked);
    } catch (e) {
      this.logService.error(e);
    }
  };

  restore = async () => {
    if (!this.editMode) {
      return;
    }

    try {
      await this.organizationUserService.restoreOrganizationUser(
        this.params.organizationId,
        this.params.organizationUserId
      );

      this.platformUtilsService.showToast(
        "success",
        null,
        this.i18nService.t("restoredUserId", this.params.name)
      );
      this.isRevoked = false;
      this.close(MemberDialogResult.Restored);
    } catch (e) {
      this.logService.error(e);
    }
  };

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected async cancel() {
    this.close(MemberDialogResult.Canceled);
  }

  private close(result: MemberDialogResult) {
    this.dialogRef.close(result);
  }
}

function mapCollectionToAccessItemView(
  collection: CollectionView,
  accessSelection?: CollectionAccessSelectionView,
  group?: GroupView
): AccessItemView {
  return {
    type: AccessItemType.Collection,
    id: group ? `${collection.id}-${group.id}` : collection.id,
    labelName: collection.name,
    listName: collection.name,
    readonly: accessSelection !== undefined,
    readonlyPermission: accessSelection ? convertToPermission(accessSelection) : undefined,
    viaGroupName: group?.name,
  };
}

function mapGroupToAccessItemView(group: GroupView): AccessItemView {
  return {
    type: AccessItemType.Group,
    id: group.id,
    labelName: group.name,
    listName: group.name,
  };
}

function mapToAccessSelections(user: OrganizationUserAdminView): AccessItemValue[] {
  if (user == undefined) {
    return [];
  }
  return [].concat(
    user.collections.map<AccessItemValue>((selection) => ({
      id: selection.id,
      type: AccessItemType.Collection,
      permission: convertToPermission(selection),
    }))
  );
}

function mapToGroupAccessSelections(groups: string[]): AccessItemValue[] {
  if (groups == undefined) {
    return [];
  }
  return [].concat(
    groups.map((groupId) => ({
      id: groupId,
      type: AccessItemType.Group,
    }))
  );
}

/**
 * Strongly typed helper to open a UserDialog
 * @param dialogService Instance of the dialog service that will be used to open the dialog
 * @param config Configuration for the dialog
 */
export function openUserAddEditDialog(
  dialogService: DialogService,
  config: DialogConfig<MemberDialogParams>
) {
  return dialogService.open<MemberDialogResult, MemberDialogParams>(MemberDialogComponent, config);
}
