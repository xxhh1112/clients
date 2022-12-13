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
  projectId?: string;
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
    // Load projects for the project secret association area
    this.projects = await this.projectService.getProjects(this.data.organizationId);

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
    this.secret = await this.secretService.getBySecretId(this.data.secretId);
    this.selectedProjects = await this.secret.projects;

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
    // Filter the list to remove that ID
    this.selectedProjects = this.selectedProjects.filter((e) => e.id != id);
  };

  updateProjectList() {
    // Remove current project list, only one project association allowed.
    const newList: SecretProjectView[] = [];
    const projectId = this.formGroup.get("project").value;

    if (projectId) {
      const selectedProject = this.projects?.filter((p) => p.id == projectId)[0];

      if (selectedProject != undefined) {
        const projectSecretView = new SecretProjectView();

        projectSecretView.id = selectedProject.id;
        projectSecretView.name = selectedProject.name;

        newList.push(projectSecretView);
      }
    }

    this.selectedProjects = newList;
  }

  async saveSecretProjectAssociation() {
    this.secret.projects = this.selectedProjects;
  }

  submit = async () => {
    this.saveSecretProjectAssociation();
    this.formGroup.markAllAsTouched();

    if (this.formGroup.invalid) {
      return;
    }

    const secretView = this.getSecretView();
    if (this.data.operation === OperationType.Add) {
      await this.createSecret(secretView, this.data.projectId);
    } else {
      secretView.id = this.data.secretId;
      await this.updateSecret(secretView);
    }
    this.dialogRef.close();
  };

  private async createSecret(secretView: SecretView, projectId?: string) {
    await this.secretService.create(this.data.organizationId, secretView, projectId);
    this.platformUtilsService.showToast("success", null, this.i18nService.t("secretCreated"));
  }

  private async updateSecret(secretView: SecretView) {
    await this.secretService.update(this.data.organizationId, secretView);
    this.platformUtilsService.showToast("success", null, this.i18nService.t("secretEdited"));
  }

  private getSecretView() {
    const emptyProjects: SecretProjectView[] = [];

    const secretView = new SecretView();
    secretView.organizationId = this.data.organizationId;
    secretView.name = this.formGroup.value.name;
    secretView.value = this.formGroup.value.value;
    secretView.note = this.formGroup.value.notes;
    secretView.projects = this.selectedProjects ? this.selectedProjects : emptyProjects;
    return secretView;
  }
}
