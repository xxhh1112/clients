import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";

import { ProjectListView } from "../../models/view/project-list.view";
import { SecretProjectView } from "../../models/view/secret-project.view";
import { SecretView } from "../../models/view/secret.view";
import { ProjectService } from "../../projects/project.service";
import { SecretService } from "../secret.service";

export enum OperationType {
  Add,
  Edit,
}

export interface SecretOperation {
  organizationId: string;
  operation: OperationType;
  secretId?: string;
}

@Component({
  selector: "sm-secret-dialog",
  templateUrl: "./secret-dialog.component.html",
})
export class SecretDialogComponent implements OnInit {
  protected formGroup = new FormGroup({
    name: new FormControl("", [Validators.required]),
    value: new FormControl("", [Validators.required]),
    notes: new FormControl(""),
    project: new FormControl(""),
  });
  protected loading = false;
  projects: ProjectListView[];
  selectedProjects: SecretProjectView[];
  secret: SecretView;

  private destroy$ = new Subject<void>();
  constructor(
    public dialogRef: DialogRef,
    @Inject(DIALOG_DATA) private data: SecretOperation,
    private secretService: SecretService,
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService,
    private projectService: ProjectService
  ) {}

  async ngOnInit() {
    if (this.data.operation === OperationType.Edit && this.data.secretId) {
      await this.loadData();
    } else if (this.data.operation !== OperationType.Add) {
      this.dialogRef.close();
      throw new Error(`The secret dialog was not called with the appropriate operation values.`);
    }

    this.formGroup
      .get("project")
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateProjectList());
  }

  async loadData() {
    this.loading = true;
    this.secret = await this.secretService.getBySecretId(this.data.secretId); //TODO make sure this api call pulls back projects so we dont need line 71-73
    this.projects = await this.projectService.getProjects(this.data.organizationId);
    this.selectedProjects = this.secret.projects;

    this.loading = false;
    this.formGroup.setValue({
      name: this.secret.name,
      value: this.secret.value,
      notes: this.secret.note,
      project: "",
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  get title() {
    return this.data.operation === OperationType.Add ? "newSecret" : "editSecret";
  }

  removeProjectAssociation = async (id: string) => {
    //filter the list to remove that ID
    this.selectedProjects = this.selectedProjects.filter((e) => e.id != id);
  };

  updateProjectList() {
    const projectId = this.formGroup.get("project").value;
    const projectToAddExistsAlready = this.selectedProjects.filter((f) => f.id == projectId);

    if (projectId != "" && projectToAddExistsAlready.length == 0) {
      const proj = this.projects.filter((p) => p.id == projectId)[0];
      const projectSecretView = new SecretProjectView();
      projectSecretView.id = proj.id;
      projectSecretView.name = proj.name;

      this.selectedProjects.push(projectSecretView);
    }
  }

  async saveSecretProjectAssociation() {
    this.secret.projects = this.selectedProjects;
    await this.secretService.update(this.data.organizationId, this.secret);
  }

  submit = async () => {
    this.saveSecretProjectAssociation();

    this.formGroup.markAllAsTouched();

    if (this.formGroup.invalid) {
      return;
    }

    const secretView = this.getSecretView();
    if (this.data.operation === OperationType.Add) {
      await this.createSecret(secretView);
    } else {
      secretView.id = this.data.secretId;
      await this.updateSecret(secretView);
    }
    this.dialogRef.close();
  };

  private async createSecret(secretView: SecretView) {
    await this.secretService.create(this.data.organizationId, secretView);
    this.platformUtilsService.showToast("success", null, this.i18nService.t("secretCreated"));
  }

  private async updateSecret(secretView: SecretView) {
    await this.secretService.update(this.data.organizationId, secretView);
    this.platformUtilsService.showToast("success", null, this.i18nService.t("secretEdited"));
  }

  private getSecretView() {
    const secretView = new SecretView();
    secretView.organizationId = this.data.organizationId;
    secretView.name = this.formGroup.value.name;
    secretView.value = this.formGroup.value.value;
    secretView.note = this.formGroup.value.notes;
    secretView.projects = this.selectedProjects;
    return secretView;
  }
}
