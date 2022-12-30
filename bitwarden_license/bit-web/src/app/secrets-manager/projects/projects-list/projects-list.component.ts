import { SelectionModel } from "@angular/cdk/collections";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

import { ProjectListView } from "../../models/view/project-list.view";

@UntilDestroy()
@Component({
  selector: "sm-projects-list",
  templateUrl: "./projects-list.component.html",
})
export class ProjectsListComponent {
  @Input()
  get projects(): ProjectListView[] {
    return this._projects;
  }
  set projects(projects: ProjectListView[]) {
    this.selection.clear();
    this._projects = projects;
  }
  private _projects: ProjectListView[];

  @Output() editProjectEvent = new EventEmitter<string>();
  @Output() viewProjectEvent = new EventEmitter<string>();
  @Output() deleteProjectEvent = new EventEmitter<ProjectListView[]>();
  @Output() onProjectCheckedEvent = new EventEmitter<string[]>();
  @Output() newProjectEvent = new EventEmitter();

  selection = new SelectionModel<string>(true, []);

  constructor() {
    this.selection.changed
      .pipe(untilDestroyed(this))
      .subscribe((_) => this.onProjectCheckedEvent.emit(this.selection.selected));
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.projects.length;
    return numSelected === numRows;
  }

  toggleAll() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.selection.select(...this.projects.map((s) => s.id));
  }

  deleteProject(projectId: string) {
    this.deleteProjectEvent.emit(this.projects.filter((p) => p.id == projectId));
  }

  bulkDeleteProjects() {
    this.deleteProjectEvent.emit(
      this.projects.filter((project) => this.selection.isSelected(project.id))
    );
  }
}
