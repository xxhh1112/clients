import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { ProjectListView } from "@bitwarden/common/models/view/projectListView";
import { SecretListView } from "@bitwarden/common/models/view/secretListView";
import { ServiceAccountView } from "@bitwarden/common/models/view/service-account-view";

import { ProjectService } from "../../projects/project.service";
import { SecretService } from "../../secrets/secret.service";
import { ServiceAccountService } from "../service-account.service";

export interface ServiceAccountOperation {
  organizationId: string;
}

@Component({
  selector: "sm-service-account-dialog",
  templateUrl: "./service-account-dialog.component.html",
})
export class ServiceAccountDialogComponent implements OnInit {
  projects: ProjectListView[];
  secrets: SecretListView[];
  formPromise: Promise<any>;

  formGroup = new FormGroup({
    name: new FormControl("", [Validators.required]),
  });

  constructor(
    public dialogRef: DialogRef,
    @Inject(DIALOG_DATA) private data: ServiceAccountOperation,
    private serviceAccountService: ServiceAccountService,
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService,
    private projectService: ProjectService,
    private secretService: SecretService
  ) {}

  async ngOnInit() {
    this.projects = await this.projectService.getProjects(this.data.organizationId);
    this.secrets = await this.secretService.getSecrets(this.data.organizationId);
  }

  async submit() {
    if (this.formGroup.invalid) {
      return;
    }

    const serviceAccountView = this.getServiceAccountView();
    this.formPromise = this.serviceAccountService.create(
      this.data.organizationId,
      serviceAccountView
    );
    await this.formPromise;
    this.platformUtilsService.showToast(
      "success",
      null,
      this.i18nService.t("serviceAccountCreated")
    );
    this.dialogRef.close();
  }

  private getServiceAccountView() {
    const serviceAccountView = new ServiceAccountView();
    serviceAccountView.organizationId = this.data.organizationId;
    serviceAccountView.name = this.formGroup.value.name;
    return serviceAccountView;
  }
}
