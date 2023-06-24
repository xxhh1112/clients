import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";

import { DialogServiceAbstraction } from "@bitwarden/angular/services/dialog";
import { OrganizationUserService } from "@bitwarden/common/abstractions/organization-user/organization-user.service";
import { TableDataSource } from "@bitwarden/components";

import { OrganizationUserView } from "../../../core";

export type BulkEnableSecretsManagerDialogData = {
  orgId: string;
  users: OrganizationUserView[];
};

export type BulkEnableSecretsManagerDialogCloseType = "error" | "success";

@Component({
  templateUrl: `bulk-enable-sm.component.html`,
})
export class BulkEnableSecretsManagerDialogComponent implements OnInit {
  protected dataSource = new TableDataSource<OrganizationUserView>();
  constructor(
    public dialogRef: DialogRef<BulkEnableSecretsManagerDialogCloseType>,
    @Inject(DIALOG_DATA) private data: BulkEnableSecretsManagerDialogData,
    private organizationUserService: OrganizationUserService
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.data.users;
  }

  enableAccess = () => {
    return this.organizationUserService
      .putOrganizationUserBulkEnableSecretsManager(
        this.data.orgId,
        this.dataSource.data.map((u) => u.id)
      )
      .then((res) => {
        this.dialogRef.close("success");
      })
      .catch((error) => {
        this.dialogRef.close("error");
      });
  };

  static open(dialogService: DialogServiceAbstraction, data: BulkEnableSecretsManagerDialogData) {
    return dialogService.open<
      BulkEnableSecretsManagerDialogCloseType,
      BulkEnableSecretsManagerDialogData
    >(BulkEnableSecretsManagerDialogComponent, { data });
  }
}
