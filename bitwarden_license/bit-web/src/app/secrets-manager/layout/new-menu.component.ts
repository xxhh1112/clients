import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

import { DialogService } from "@bitwarden/components";

import {
  ProjectDialogComponent,
  ProjectOperation,
} from "../projects/dialog/project-dialog.component";
import {
  OperationType,
  SecretDialogComponent,
  SecretOperation,
} from "../secrets/dialog/secret-dialog.component";
import {
  ServiceAccountDialogComponent,
  ServiceAccountOperation,
} from "../service-accounts/dialog/service-account-dialog.component";

@UntilDestroy()
@Component({
  selector: "sm-new-menu",
  templateUrl: "./new-menu.component.html",
})
export class NewMenuComponent implements OnInit {
  private organizationId: string;

  constructor(private route: ActivatedRoute, private dialogService: DialogService) {}

  ngOnInit() {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params: any) => {
      this.organizationId = params.organizationId;
    });
  }

  openSecretDialog() {
    this.dialogService.open<unknown, SecretOperation>(SecretDialogComponent, {
      data: {
        organizationId: this.organizationId,
        operation: OperationType.Add,
      },
    });
  }

  openProjectDialog() {
    this.dialogService.open<unknown, ProjectOperation>(ProjectDialogComponent, {
      data: {
        organizationId: this.organizationId,
        operation: OperationType.Add,
      },
    });
  }

  openServiceAccountDialog() {
    this.dialogService.open<unknown, ServiceAccountOperation>(ServiceAccountDialogComponent, {
      data: {
        organizationId: this.organizationId,
      },
    });
  }
}
