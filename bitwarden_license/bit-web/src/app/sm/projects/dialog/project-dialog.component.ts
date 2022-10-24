import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { ProjectView } from "@bitwarden/common/models/view/project.view";

import { ProjectService } from "../../projects/project.service";

export enum OperationType {
  Add,
  Edit,
}

export interface ProjectOperation {
  organizationId: string;
  operation: OperationType;
  projectId?: string;
}

@Component({
  selector: "sm-project-dialog",
  templateUrl: "./project-dialog.component.html",
})
export class ProjectDialogComponent implements OnInit {
  protected formGroup = new FormGroup({
    name: new FormControl("", [Validators.required]),
  });
  protected loading = false;

  constructor(
    public dialogRef: DialogRef,
    @Inject(DIALOG_DATA) private data: ProjectOperation,
    private projectService: ProjectService,
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService
  ) {}

  async ngOnInit() {
    if (this.data.operation === OperationType.Edit && this.data.projectId) {
      await this.loadData();
    } else if (this.data.operation !== OperationType.Add) {
      this.dialogRef.close();
      throw new Error(`The project dialog was not called with the appropriate operation values.`);
    }
  }

  async loadData() {
    this.loading = true;
    const project: ProjectView = await this.projectService.getByProjectId(this.data.projectId);
    this.loading = false;
    this.formGroup.setValue({ name: project.name });
  }

  get title() {
    return this.data.operation === OperationType.Add ? "newProject" : "editProject";
  }

  submit = async () => {
    if (this.formGroup.invalid) {
      return;
    }

    const projectView = this.getProjectView();
    if (this.data.operation === OperationType.Add) {
      await this.createProject(projectView);
    } else {
      projectView.id = this.data.projectId;
      await this.updateProject(projectView);
    }
    this.dialogRef.close();
  };

  private async createProject(projectView: ProjectView) {
    await this.projectService.create(this.data.organizationId, projectView);
    this.platformUtilsService.showToast("success", null, this.i18nService.t("projectCreated"));
  }

  private async updateProject(projectView: ProjectView) {
    await this.projectService.update(this.data.organizationId, projectView);
    this.platformUtilsService.showToast("success", null, this.i18nService.t("projectSaved"));
  }

  private getProjectView() {
    const projectView = new ProjectView();
    projectView.organizationId = this.data.organizationId;
    projectView.name = this.formGroup.value.name;
    return projectView;
  }
}
