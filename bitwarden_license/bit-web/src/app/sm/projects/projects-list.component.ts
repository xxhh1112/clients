import { SelectionModel } from "@angular/cdk/collections";
import { Component, EventEmitter, Input, OnDestroy, Output } from "@angular/core";
import { Subject, takeUntil } from "rxjs";

import { ProjectResponse } from "./responses/project.response";

@Component({
  selector: "sm-projects-list",
  templateUrl: "./projects-list.component.html",
})
export class ProjectsListComponent implements OnDestroy {
  @Input() projects: ProjectResponse[];

  @Output() editProjectEvent = new EventEmitter<string>();
  @Output() copyProjectNameEvent = new EventEmitter<string>();
  @Output() copyProjectValueEvent = new EventEmitter<string>();
  @Output() projectsEvent = new EventEmitter<string>();
  @Output() deleteProjectEvent = new EventEmitter<string>();
  @Output() onProjectCheckedEvent = new EventEmitter<string[]>();

  private destroy$: Subject<void> = new Subject<void>();

  selection = new SelectionModel<string>(true, []);

  constructor() {
    this.selection.changed
      .pipe(takeUntil(this.destroy$))
      .subscribe((_) => this.onProjectCheckedEvent.emit(this.selection.selected));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
}
