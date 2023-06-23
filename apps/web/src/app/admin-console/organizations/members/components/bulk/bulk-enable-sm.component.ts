import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";

import { OrganizationUserService } from "@bitwarden/common/abstractions/organization-user/organization-user.service";
import { TableDataSource } from "@bitwarden/components";

import { OrganizationUserView } from "../../../core";

type BulkEnableSecretsManagerOperation = {
  orgId: string;
  users: OrganizationUserView[];
};

@Component({
  templateUrl: `bulk-enable-sm.component.html`,
})
export class BulkEnableSecretsManagerComponent implements OnInit {
  protected dataSource = new TableDataSource<OrganizationUserView>();
  constructor(
    public dialogRef: DialogRef,
    @Inject(DIALOG_DATA) private dialogData: BulkEnableSecretsManagerOperation,
    private organizationUserService: OrganizationUserService
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.dialogData.users;
  }

  enableAccess() {
    this.organizationUserService.postOrganizationUserBulkEnableSecretsManager(
      this.dialogData.orgId,
      this.dataSource.data.map((u) => u.id)
    );
    this.dialogRef.close();
  }
}
