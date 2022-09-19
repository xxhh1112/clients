import { Component, OnDestroy, OnInit, ViewChild, ViewContainerRef } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { concatMap, Subject, takeUntil } from "rxjs";
import { first } from "rxjs/operators";

import { SearchPipe } from "@bitwarden/angular/pipes/search.pipe";
import { ModalService } from "@bitwarden/angular/services/modal.service";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { SearchService } from "@bitwarden/common/abstractions/search.service";
import { Utils } from "@bitwarden/common/misc/utils";
import { CollectionData } from "@bitwarden/common/models/data/collectionData";
import { Collection } from "@bitwarden/common/models/domain/collection";
import { OrganizationUserBulkRequest } from "@bitwarden/common/models/request/organizationUserBulkRequest";
import { CollectionDetailsResponse } from "@bitwarden/common/models/response/collectionResponse";
import { IGroupDetailsResponse } from "@bitwarden/common/models/response/groupResponse";
import { CollectionView } from "@bitwarden/common/models/view/collectionView";

import { EntityUsersComponent } from "./entity-users.component";
import { GroupAddEditComponent } from "./group-add-edit.component";

type CollectionViewMap = {
  [id: string]: CollectionView;
};

interface IGroupDetailsView extends IGroupDetailsResponse {
  /**
   * True if the group is selected in the table
   */
  checked?: boolean;

  /**
   * A list of collection names the group has access to
   */
  collectionNames?: string[];
}

@Component({
  selector: "app-org-groups",
  templateUrl: "groups.component.html",
})
export class GroupsComponent implements OnInit, OnDestroy {
  @ViewChild("addEdit", { read: ViewContainerRef, static: true }) addEditModalRef: ViewContainerRef;
  @ViewChild("usersTemplate", { read: ViewContainerRef, static: true })
  usersModalRef: ViewContainerRef;

  loading = true;
  organizationId: string;
  groups: IGroupDetailsView[];
  collectionMap: CollectionViewMap = {};
  selectAll = false;

  protected didScroll = false;
  protected pageSize = 100;
  protected maxCollections = 2;

  private pagedGroupsCount = 0;
  private pagedGroups: IGroupDetailsView[];
  private searchedGroups: IGroupDetailsView[];
  private _searchText: string;
  private destroy$ = new Subject<void>();

  get searchText() {
    return this._searchText;
  }
  set searchText(value: string) {
    this._searchText = value;
    // Manually update as we are not using the search pipe in the template
    this.updateSearchedGroups();
  }

  /**
   * The list of groups that should be visible in the table.
   * This is needed as there are two modes (paging/searching) and
   * we need a reference to the currently visible groups for
   * the Select All checkbox
   */
  get visibleGroups(): IGroupDetailsView[] {
    if (this.isPaging()) {
      return this.pagedGroups;
    }
    if (this.isSearching()) {
      return this.searchedGroups;
    }
    return this.groups;
  }

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private i18nService: I18nService,
    private modalService: ModalService,
    private platformUtilsService: PlatformUtilsService,
    private searchService: SearchService,
    private logService: LogService,
    private collectionService: CollectionService,
    private searchPipe: SearchPipe
  ) {}

  async ngOnInit() {
    this.route.parent.params
      .pipe(
        concatMap(async (params) => {
          this.organizationId = params.organizationId;
          await this.loadCollections();
          await this.load();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.route.queryParams
      .pipe(
        first(),
        concatMap(async (qParams) => {
          this.searchText = qParams.search;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async load() {
    const response = await this.apiService.getGroups(this.organizationId);
    const groups = response.data != null && response.data.length > 0 ? response.data : [];
    this.groups = groups
      .sort(Utils.getSortFunction(this.i18nService, "name"))
      .map<IGroupDetailsView>((g) => ({
        ...g,
        checked: false,
        collectionNames: g.collections
          .map((c) => this.collectionMap[c.id]?.name)
          .sort(this.i18nService.collator?.compare),
      }));
    this.resetPaging();
    this.updateSearchedGroups();
    this.loading = false;
  }

  private updateSearchedGroups() {
    if (this.searchService.isSearchable(this.searchText)) {
      // Making use of the pipe in the component as we need know which groups where filtered
      this.searchedGroups = this.searchPipe.transform(this.groups, this.searchText, "name", "id");
    }
  }

  async loadCollections() {
    const response = await this.apiService.getCollections(this.organizationId);
    const collections = response.data.map(
      (r) => new Collection(new CollectionData(r as CollectionDetailsResponse))
    );
    const decryptedCollections = await this.collectionService.decryptMany(collections);

    // Convert to an object using collection Ids as keys for faster name lookups
    decryptedCollections.forEach((c) => (this.collectionMap[c.id] = c));
  }

  loadMore() {
    if (!this.groups || this.groups.length <= this.pageSize) {
      return;
    }
    const pagedLength = this.pagedGroups.length;
    let pagedSize = this.pageSize;
    if (pagedLength === 0 && this.pagedGroupsCount > this.pageSize) {
      pagedSize = this.pagedGroupsCount;
    }
    if (this.groups.length > pagedLength) {
      this.pagedGroups = this.pagedGroups.concat(
        this.groups.slice(pagedLength, pagedLength + pagedSize)
      );
    }
    this.pagedGroupsCount = this.pagedGroups.length;
    this.didScroll = this.pagedGroups.length > this.pageSize;
  }

  async edit(group: IGroupDetailsView) {
    const [modal] = await this.modalService.openViewRef(
      GroupAddEditComponent,
      this.addEditModalRef,
      (comp) => {
        comp.organizationId = this.organizationId;
        comp.groupId = group != null ? group.id : null;
        comp.onSavedGroup.pipe(takeUntil(this.destroy$)).subscribe(() => {
          modal.close();
          this.load();
        });
        comp.onDeletedGroup.pipe(takeUntil(this.destroy$)).subscribe(() => {
          modal.close();
          this.removeGroup(group.id);
        });
      }
    );
  }

  add() {
    this.edit(null);
  }

  async delete(group: IGroupDetailsView) {
    const confirmed = await this.platformUtilsService.showDialog(
      this.i18nService.t("deleteGroupConfirmation"),
      group.name,
      this.i18nService.t("yes"),
      this.i18nService.t("no"),
      "warning"
    );
    if (!confirmed) {
      return false;
    }

    try {
      await this.apiService.deleteGroup(this.organizationId, group.id);
      this.platformUtilsService.showToast(
        "success",
        null,
        this.i18nService.t("deletedGroupId", group.name)
      );
      this.removeGroup(group.id);
    } catch (e) {
      this.logService.error(e);
    }
  }

  async deleteAllSelected() {
    const groupsToDelete = this.groups.filter((g) => g.checked);

    if (groupsToDelete.length == 0) {
      return;
    }

    const deleteMessage = groupsToDelete.map((g) => g.name).join(", ");
    const confirmed = await this.platformUtilsService.showDialog(
      deleteMessage,
      this.i18nService.t("deleteMultipleGroupsConfirmation", groupsToDelete.length.toString()),
      this.i18nService.t("yes"),
      this.i18nService.t("no"),
      "warning"
    );
    if (!confirmed) {
      return false;
    }

    try {
      const result = await this.apiService.deleteManyGroups(
        this.organizationId,
        new OrganizationUserBulkRequest(groupsToDelete.map((g) => g.id))
      );
      this.platformUtilsService.showToast("success", null, `Delete ${result.data.length} groups!`);

      groupsToDelete.forEach((g) => this.removeGroup(g.id));
    } catch (e) {
      this.logService.error(e);
    }
  }

  async users(group: IGroupDetailsView) {
    const [modal] = await this.modalService.openViewRef(
      EntityUsersComponent,
      this.usersModalRef,
      (comp) => {
        comp.organizationId = this.organizationId;
        comp.entity = "group";
        comp.entityId = group.id;
        comp.entityName = group.name;

        comp.onEditedUsers.pipe(takeUntil(this.destroy$)).subscribe(() => {
          modal.close();
        });
      }
    );
  }

  resetPaging() {
    this.pagedGroups = [];
    this.loadMore();
  }

  isSearching() {
    return this.searchService.isSearchable(this.searchText);
  }

  check(group: IGroupDetailsView) {
    group.checked = !group.checked;
  }

  toggleAllVisible(event: Event) {
    this.visibleGroups.forEach((g) => (g.checked = (event.target as HTMLInputElement).checked));
  }

  isPaging() {
    const searching = this.isSearching();
    if (searching && this.didScroll) {
      this.resetPaging();
    }
    return !searching && this.groups && this.groups.length > this.pageSize;
  }

  private removeGroup(id: string) {
    const index = this.groups.findIndex((g) => g.id === id);
    if (index > -1) {
      this.groups.splice(index, 1);
      this.resetPaging();
      this.updateSearchedGroups();
    }
  }
}
