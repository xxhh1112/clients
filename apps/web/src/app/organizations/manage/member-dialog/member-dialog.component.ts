import { DialogConfig, DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { OrganizationService } from "@bitwarden/common/abstractions/organization/organization.service.abstraction";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { OrganizationUserStatusType } from "@bitwarden/common/enums/organizationUserStatusType";
import { OrganizationUserType } from "@bitwarden/common/enums/organizationUserType";
import { PermissionsApi } from "@bitwarden/common/models/api/permissions.api";
import { CollectionData } from "@bitwarden/common/models/data/collection.data";
import { Collection } from "@bitwarden/common/models/domain/collection";
import { OrganizationUserInviteRequest } from "@bitwarden/common/models/request/organization-user-invite.request";
import { OrganizationUserUpdateRequest } from "@bitwarden/common/models/request/organization-user-update.request";
import { SelectionReadOnlyRequest } from "@bitwarden/common/models/request/selection-read-only.request";
import { CollectionDetailsResponse } from "@bitwarden/common/models/response/collection.response";
import { CollectionView } from "@bitwarden/common/models/view/collection.view";
import { DialogService } from "@bitwarden/components";

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
export class MemberDialogComponent implements OnInit {
  loading = true;
  editMode = false;
  isRevoked = false;
  title: string;
  emails: string;
  type: OrganizationUserType = OrganizationUserType.User;
  permissions = new PermissionsApi();
  showCustom = false;
  access: "all" | "selected" = "selected";
  collections: CollectionView[] = [];
  organizationUserType = OrganizationUserType;
  canUseCustomPermissions: boolean;

  protected tabIndex: MemberDialogTab;
  // Stub, to be filled out in upcoming PRs
  protected formGroup = this.formBuilder.group({});

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

  constructor(
    @Inject(DIALOG_DATA) protected params: MemberDialogParams,
    private dialogRef: DialogRef<MemberDialogResult>,
    private apiService: ApiService,
    private i18nService: I18nService,
    private collectionService: CollectionService,
    private platformUtilsService: PlatformUtilsService,
    private organizationService: OrganizationService,
    private logService: LogService,
    private formBuilder: FormBuilder
  ) {}

  async ngOnInit() {
    this.editMode = this.loading = this.params.organizationUserId != null;
    this.tabIndex = this.params.initialTab ?? MemberDialogTab.Role;

    const organization = this.organizationService.get(this.params.organizationId);
    this.canUseCustomPermissions = organization.useCustomPermissions;
    await this.loadCollections();

    if (this.editMode) {
      this.editMode = true;
      this.title = this.i18nService.t("editMember");
      try {
        const user = await this.apiService.getOrganizationUser(
          this.params.organizationId,
          this.params.organizationUserId
        );
        this.access = user.accessAll ? "all" : "selected";
        this.type = user.type;
        this.isRevoked = user.status === OrganizationUserStatusType.Revoked;
        if (user.type === OrganizationUserType.Custom) {
          this.permissions = user.permissions;
        }
        if (user.collections != null && this.collections != null) {
          user.collections.forEach((s) => {
            const collection = this.collections.filter((c) => c.id === s.id);
            if (collection != null && collection.length > 0) {
              (collection[0] as any).checked = true;
              collection[0].readOnly = s.readOnly;
              collection[0].hidePasswords = s.hidePasswords;
            }
          });
        }
      } catch (e) {
        this.logService.error(e);
      }
    } else {
      this.title = this.i18nService.t("inviteMember");
    }

    this.loading = false;
  }

  async loadCollections() {
    const response = await this.apiService.getCollections(this.params.organizationId);
    const collections = response.data.map(
      (r) => new Collection(new CollectionData(r as CollectionDetailsResponse))
    );
    this.collections = await this.collectionService.decryptMany(collections);
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
    if (!this.canUseCustomPermissions && this.type === OrganizationUserType.Custom) {
      this.platformUtilsService.showToast(
        "error",
        null,
        this.i18nService.t("customNonEnterpriseError")
      );
      return;
    }
    let collections: SelectionReadOnlyRequest[] = null;
    if (this.access !== "all") {
      collections = this.collections
        .filter((c) => (c as any).checked)
        .map((c) => new SelectionReadOnlyRequest(c.id, !!c.readOnly, !!c.hidePasswords));
    }

    try {
      if (this.editMode) {
        await this.updateUser(collections);
      } else {
        await this.inviteUser(collections);
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
      "warning"
    );
    if (!confirmed) {
      return false;
    }

    try {
      await this.apiService.deleteOrganizationUser(
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
      "warning"
    );
    if (!confirmed) {
      return false;
    }

    try {
      await this.apiService.revokeOrganizationUser(
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
      await this.apiService.restoreOrganizationUser(
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

  protected async cancel() {
    this.close(MemberDialogResult.Canceled);
  }

  private close(result: MemberDialogResult) {
    this.dialogRef.close(result);
  }

  async updateUser(collections: SelectionReadOnlyRequest[]) {
    const request = new OrganizationUserUpdateRequest();
    request.accessAll = this.access === "all";
    request.type = this.type;
    request.collections = collections;
    request.permissions = this.setRequestPermissions(
      request.permissions ?? new PermissionsApi(),
      request.type !== OrganizationUserType.Custom
    );
    await this.apiService.putOrganizationUser(
      this.params.organizationId,
      this.params.organizationUserId,
      request
    );
  }

  async inviteUser(collections: SelectionReadOnlyRequest[]) {
    const request = new OrganizationUserInviteRequest();
    request.emails = [...new Set(this.emails.trim().split(/\s*,\s*/))];
    request.accessAll = this.access === "all";
    request.type = this.type;
    request.permissions = this.setRequestPermissions(
      request.permissions ?? new PermissionsApi(),
      request.type !== OrganizationUserType.Custom
    );
    request.collections = collections;
    await this.apiService.postOrganizationUserInvite(this.params.organizationId, request);
  }
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
