import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  ViewContainerRef,
} from "@angular/core";

import { CiphersComponent as BaseCiphersComponent } from "@bitwarden/angular/components/ciphers.component";
import { ModalService } from "@bitwarden/angular/services/modal.service";
import { CipherService } from "@bitwarden/common/abstractions/cipher.service";
import { EventService } from "@bitwarden/common/abstractions/event.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { OrganizationService } from "@bitwarden/common/abstractions/organization/organization.service.abstraction";
import { PasswordRepromptService } from "@bitwarden/common/abstractions/passwordReprompt.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { SearchService } from "@bitwarden/common/abstractions/search.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { TokenService } from "@bitwarden/common/abstractions/token.service";
import { TotpService } from "@bitwarden/common/abstractions/totp.service";
import { CipherRepromptType } from "@bitwarden/common/enums/cipherRepromptType";
import { CipherType } from "@bitwarden/common/enums/cipherType";
import { EventType } from "@bitwarden/common/enums/eventType";
import { Organization } from "@bitwarden/common/models/domain/organization";
import { TreeNode } from "@bitwarden/common/models/domain/tree-node";
import { CipherView } from "@bitwarden/common/models/view/cipher.view";

import { BulkDeleteComponent } from "./bulk-delete.component";
import { BulkMoveComponent } from "./bulk-move.component";
import { BulkRestoreComponent } from "./bulk-restore.component";
import { BulkShareComponent } from "./bulk-share.component";
import { VaultFilterService } from "./vault-filter/services/abstractions/vault-filter.service";
import { VaultFilter } from "./vault-filter/shared/models/vault-filter.model";
import { CollectionFilter } from "./vault-filter/shared/models/vault-filter.type";

const MaxCheckedCount = 500;

@Component({
  selector: "app-vault-ciphers",
  templateUrl: "ciphers.component.html",
})
export class CiphersComponent extends BaseCiphersComponent implements OnDestroy {
  @Input() showAddNew = true;
  @Input() activeFilter: VaultFilter;
  @Output() activeFilterChanged = new EventEmitter<VaultFilter>();
  @Output() onAttachmentsClicked = new EventEmitter<CipherView>();
  @Output() onShareClicked = new EventEmitter<CipherView>();
  @Output() onEditCollectionsClicked = new EventEmitter<CipherView>();
  @Output() onCloneClicked = new EventEmitter<CipherView>();
  @Output() onOrganzationBadgeClicked = new EventEmitter<string>();

  @ViewChild("bulkDeleteTemplate", { read: ViewContainerRef, static: true })
  bulkDeleteModalRef: ViewContainerRef;
  @ViewChild("bulkRestoreTemplate", { read: ViewContainerRef, static: true })
  bulkRestoreModalRef: ViewContainerRef;
  @ViewChild("bulkMoveTemplate", { read: ViewContainerRef, static: true })
  bulkMoveModalRef: ViewContainerRef;
  @ViewChild("bulkShareTemplate", { read: ViewContainerRef, static: true })
  bulkShareModalRef: ViewContainerRef;

  pagedCiphers: CipherView[] = [];
  pagedCollections: TreeNode<CollectionFilter>[] = [];
  cipherType = CipherType;
  actionPromise: Promise<any>;
  userHasPremiumAccess = false;
  organizations: Organization[] = [];
  profileName: string;
  showOrganizationBadge = true;

  protected pageSizeLimit = 200;
  protected isAllChecked = false;
  protected didScroll = false;
  protected currentPagedCiphersCount = 0;
  protected currentPagedCollectionsCount = 0;
  protected refreshing = false;

  get collections() {
    return this.activeFilter?.selectedCollectionNode?.children;
  }

  get showCollections() {
    return this.filteredCollections && !(this.searchText?.length > 1);
  }

  get filteredCollections() {
    return this.isPaging() ? this.pagedCollections : this.collections;
  }

  get filteredCiphers() {
    return this.isPaging() ? this.pagedCiphers : this.ciphers;
  }

  constructor(
    searchService: SearchService,
    protected i18nService: I18nService,
    protected platformUtilsService: PlatformUtilsService,
    protected vaultFilterService: VaultFilterService,
    protected cipherService: CipherService,
    protected eventService: EventService,
    protected totpService: TotpService,
    protected stateService: StateService,
    protected passwordRepromptService: PasswordRepromptService,
    protected modalService: ModalService,
    protected logService: LogService,
    private organizationService: OrganizationService,
    private tokenService: TokenService
  ) {
    super(searchService);
  }

  ngOnDestroy() {
    this.selectAll(false);
  }

  async applyFilter(filter: (cipher: CipherView) => boolean = null) {
    this.selectAll(false);
    this.isAllChecked = false;
    this.collections?.forEach((col) => {
      (col as any).checked = false;
    });
    this.pagedCollections = [];
    if (!this.refreshing && this.isPaging()) {
      this.currentPagedCollectionsCount = 0;
      this.currentPagedCiphersCount = 0;
    }
    await super.applyFilter(filter);
  }

  // load() is called after the page loads and the first sync has completed.
  // Do not use ngOnInit() for anything that requires sync data.
  async load(filter: (cipher: CipherView) => boolean = null, deleted = false) {
    await super.load(filter, deleted);
    this.profileName = await this.tokenService.getName();
    this.organizations = await this.organizationService.getAll();
    this.userHasPremiumAccess = await this.stateService.getCanAccessPremium();
  }

  async refresh() {
    try {
      this.refreshing = true;
      await this.reload(this.filter, this.deleted);
    } finally {
      this.refreshing = false;
    }
  }

  loadMore() {
    // If we have less rows than the page size, we don't need to page anything
    if (this.ciphers.length + (this.collections?.length || 0) <= this.pageSizeLimit) {
      return;
    }

    let pageSpaceLeft = this.pageSizeLimit;
    if (
      this.refreshing &&
      this.pagedCiphers.length + this.pagedCollections.length === 0 &&
      this.currentPagedCiphersCount + this.currentPagedCollectionsCount > this.pageSizeLimit
    ) {
      // When we refresh, we want to load the previous amount of items, not restart the paging
      pageSpaceLeft = this.currentPagedCiphersCount + this.currentPagedCollectionsCount;
    }
    // if there are still collections to show
    if (this.collections?.length > this.pagedCollections.length) {
      const collectionsToAdd = this.collections.slice(
        this.pagedCollections.length,
        this.currentPagedCollectionsCount + pageSpaceLeft
      );
      this.pagedCollections = this.pagedCollections.concat(collectionsToAdd);
      // set the current count to the new count of paged collections
      this.currentPagedCollectionsCount = this.pagedCollections.length;
      // subtract the available page size by the amount of collections we just added, default to 0 if negative
      pageSpaceLeft =
        collectionsToAdd.length > pageSpaceLeft ? 0 : pageSpaceLeft - collectionsToAdd.length;
    }
    // if we have room left to show ciphers and we have ciphers to show
    if (pageSpaceLeft > 0 && this.ciphers.length > this.pagedCiphers.length) {
      this.pagedCiphers = this.pagedCiphers.concat(
        this.ciphers.slice(this.pagedCiphers.length, this.currentPagedCiphersCount + pageSpaceLeft)
      );
      // set the current count to the new count of paged ciphers
      this.currentPagedCiphersCount = this.pagedCiphers.length;
    }
    // set a flag if we actually loaded the second page while paging
    this.didScroll = this.pagedCiphers.length + this.pagedCollections.length > this.pageSizeLimit;
  }

  isPaging() {
    const searching = this.isSearching();
    if (searching && this.didScroll) {
      this.resetPaging();
    }
    const totalRows =
      this.ciphers.length + (this.activeFilter?.selectedCollectionNode?.children.length || 0);
    return !searching && totalRows > this.pageSizeLimit;
  }

  async resetPaging() {
    this.pagedCollections = [];
    this.pagedCiphers = [];
    this.loadMore();
  }

  async doSearch(indexedCiphers?: CipherView[]) {
    this.ciphers = await this.searchService.searchCiphers(
      this.searchText,
      [this.filter, this.deletedFilter],
      indexedCiphers
    );
    this.resetPaging();
  }

  launch(uri: string) {
    this.platformUtilsService.launchUri(uri);
  }

  async attachments(c: CipherView) {
    if (!(await this.repromptCipher(c))) {
      return;
    }
    this.onAttachmentsClicked.emit(c);
  }

  async share(c: CipherView) {
    if (!(await this.repromptCipher(c))) {
      return;
    }
    this.onShareClicked.emit(c);
  }

  editCollections(c: CipherView) {
    this.onEditCollectionsClicked.emit(c);
  }

  selectCollection(c: TreeNode<CollectionFilter>) {
    this.navigateCollection(c);
  }

  navigateCollection(node: TreeNode<CollectionFilter>) {
    const filter = this.activeFilter;
    filter.selectedCollectionNode = node;
    this.activeFilterChanged.emit(filter);
  }

  async clone(c: CipherView) {
    if (!(await this.repromptCipher(c))) {
      return;
    }
    this.onCloneClicked.emit(c);
  }

  async deleteCipher(c: CipherView): Promise<boolean> {
    if (!(await this.repromptCipher(c))) {
      return;
    }
    if (this.actionPromise != null) {
      return;
    }
    const permanent = c.isDeleted;
    const confirmed = await this.platformUtilsService.showDialog(
      this.i18nService.t(
        permanent ? "permanentlyDeleteItemConfirmation" : "deleteItemConfirmation"
      ),
      this.i18nService.t(permanent ? "permanentlyDeleteItem" : "deleteItem"),
      this.i18nService.t("yes"),
      this.i18nService.t("no"),
      "warning"
    );
    if (!confirmed) {
      return false;
    }

    try {
      this.actionPromise = this.deleteCipherWithServer(c.id, permanent);
      await this.actionPromise;
      this.platformUtilsService.showToast(
        "success",
        null,
        this.i18nService.t(permanent ? "permanentlyDeletedItem" : "deletedItem")
      );
      this.refresh();
    } catch (e) {
      this.logService.error(e);
    }
    this.actionPromise = null;
  }

  async bulkDelete() {
    if (!(await this.repromptCipher())) {
      return;
    }

    const selectedIds = this.getSelectedCipherIds();
    if (selectedIds.length === 0) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("nothingSelected")
      );
      return;
    }

    const [modal] = await this.modalService.openViewRef(
      BulkDeleteComponent,
      this.bulkDeleteModalRef,
      (comp) => {
        comp.permanent = this.deleted;
        comp.cipherIds = selectedIds;
        // eslint-disable-next-line rxjs-angular/prefer-takeuntil, rxjs/no-async-subscribe
        comp.onDeleted.subscribe(async () => {
          modal.close();
          await this.refresh();
        });
      }
    );
  }

  async restore(c: CipherView): Promise<boolean> {
    if (this.actionPromise != null || !c.isDeleted) {
      return;
    }
    const confirmed = await this.platformUtilsService.showDialog(
      this.i18nService.t("restoreItemConfirmation"),
      this.i18nService.t("restoreItem"),
      this.i18nService.t("yes"),
      this.i18nService.t("no"),
      "warning"
    );
    if (!confirmed) {
      return false;
    }

    try {
      this.actionPromise = this.cipherService.restoreWithServer(c.id);
      await this.actionPromise;
      this.platformUtilsService.showToast("success", null, this.i18nService.t("restoredItem"));
      this.refresh();
    } catch (e) {
      this.logService.error(e);
    }
    this.actionPromise = null;
  }

  async bulkRestore() {
    if (!(await this.repromptCipher())) {
      return;
    }

    const selectedIds = this.getSelectedCipherIds();
    if (selectedIds.length === 0) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("nothingSelected")
      );
      return;
    }

    const [modal] = await this.modalService.openViewRef(
      BulkRestoreComponent,
      this.bulkRestoreModalRef,
      (comp) => {
        comp.cipherIds = selectedIds;
        // eslint-disable-next-line rxjs-angular/prefer-takeuntil, rxjs/no-async-subscribe
        comp.onRestored.subscribe(async () => {
          modal.close();
          await this.refresh();
        });
      }
    );
  }

  async bulkShare() {
    if (!(await this.repromptCipher())) {
      return;
    }

    const selectedCiphers = this.getSelectedCiphers();
    if (selectedCiphers.length === 0) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("nothingSelected")
      );
      return;
    }

    const [modal] = await this.modalService.openViewRef(
      BulkShareComponent,
      this.bulkShareModalRef,
      (comp) => {
        comp.ciphers = selectedCiphers;
        // eslint-disable-next-line rxjs-angular/prefer-takeuntil, rxjs/no-async-subscribe
        comp.onShared.subscribe(async () => {
          modal.close();
          await this.refresh();
        });
      }
    );
  }

  async bulkMove() {
    if (!(await this.repromptCipher())) {
      return;
    }

    const selectedIds = this.getSelectedCipherIds();
    if (selectedIds.length === 0) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("nothingSelected")
      );
      return;
    }

    const [modal] = await this.modalService.openViewRef(
      BulkMoveComponent,
      this.bulkMoveModalRef,
      (comp) => {
        comp.cipherIds = selectedIds;
        // eslint-disable-next-line rxjs-angular/prefer-takeuntil, rxjs/no-async-subscribe
        comp.onMoved.subscribe(async () => {
          modal.close();
          await this.refresh();
        });
      }
    );
  }

  async copy(cipher: CipherView, value: string, typeI18nKey: string, aType: string) {
    if (
      this.passwordRepromptService.protectedFields().includes(aType) &&
      !(await this.repromptCipher(cipher))
    ) {
      return;
    }

    if (value == null || (aType === "TOTP" && !this.displayTotpCopyButton(cipher))) {
      return;
    } else if (value === cipher.login.totp) {
      value = await this.totpService.getCode(value);
    }

    if (!cipher.viewPassword) {
      return;
    }

    this.platformUtilsService.copyToClipboard(value, { window: window });
    this.platformUtilsService.showToast(
      "info",
      null,
      this.i18nService.t("valueCopied", this.i18nService.t(typeI18nKey))
    );

    if (typeI18nKey === "password" || typeI18nKey === "verificationCodeTotp") {
      this.eventService.collect(EventType.Cipher_ClientToggledHiddenFieldVisible, cipher.id);
    } else if (typeI18nKey === "securityCode") {
      this.eventService.collect(EventType.Cipher_ClientCopiedCardCode, cipher.id);
    }
  }

  selectAll(select: boolean) {
    if (select) {
      this.selectAll(false);
    }
    const selectCount =
      select && this.ciphers.length > MaxCheckedCount ? MaxCheckedCount : this.ciphers.length;
    for (let i = 0; i < selectCount; i++) {
      this.checkCipher(this.ciphers[i], select);
    }
  }

  checkCipher(c: CipherView, select?: boolean) {
    (c as any).checked = select == null ? !(c as any).checked : select;
  }

  getSelectedCiphers(): CipherView[] {
    if (this.ciphers == null) {
      return [];
    }
    return this.ciphers.filter((c) => !!(c as any).checked);
  }

  getSelectedCipherIds(): string[] {
    return this.getSelectedCiphers().map((c) => c.id);
  }

  displayTotpCopyButton(cipher: CipherView) {
    return (
      (cipher?.login?.hasTotp ?? false) && (cipher.organizationUseTotp || this.userHasPremiumAccess)
    );
  }

  async selectCipher(cipher: CipherView) {
    if (await this.repromptCipher(cipher)) {
      super.selectCipher(cipher);
    }
  }

  onOrganizationClicked(organizationId: string) {
    this.onOrganzationBadgeClicked.emit(organizationId);
  }

  protected deleteCipherWithServer(id: string, permanent: boolean) {
    return permanent
      ? this.cipherService.deleteWithServer(id)
      : this.cipherService.softDeleteWithServer(id);
  }

  protected showFixOldAttachments(c: CipherView) {
    return c.hasOldAttachments && c.organizationId == null;
  }

  protected async repromptCipher(c?: CipherView) {
    if (c) {
      return (
        c.reprompt === CipherRepromptType.None ||
        (await this.passwordRepromptService.showPasswordPrompt())
      );
    } else {
      const selectedCiphers = this.getSelectedCiphers();
      const notProtected = !selectedCiphers.find(
        (cipher) => cipher.reprompt !== CipherRepromptType.None
      );

      return notProtected || (await this.passwordRepromptService.showPasswordPrompt());
    }
  }
}
