import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from "@angular/core";

import { ModalService } from "@bitwarden/angular/services/modal.service";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
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
import { Organization } from "@bitwarden/common/models/domain/organization";
import { TreeNode } from "@bitwarden/common/models/domain/tree-node";
import { GroupResponse } from "@bitwarden/common/models/response/group.response";
import { CipherView } from "@bitwarden/common/models/view/cipher.view";
import { CollectionView } from "@bitwarden/common/models/view/collection.view";

import { BulkDeleteComponent } from "../../vault/bulk-delete.component";
import { CiphersComponent as BaseCiphersComponent, ItemRow } from "../../vault/ciphers.component";
import { VaultFilterService } from "../../vault/vault-filter/services/abstractions/vault-filter.service";
import { CollectionFilter } from "../../vault/vault-filter/shared/models/vault-filter.type";

const MaxCheckedCount = 500;

@Component({
  selector: "app-org-vault-ciphers",
  templateUrl: "../../vault/ciphers.component.html",
})
export class CiphersComponent extends BaseCiphersComponent implements OnDestroy, OnChanges {
  @Input() organization: Organization;
  @Output() onEventsClicked = new EventEmitter<CipherView>();

  groups: GroupResponse[] = [];
  accessEvents = false;

  protected allCiphers: CipherView[] = [];

  constructor(
    searchService: SearchService,
    i18nService: I18nService,
    platformUtilsService: PlatformUtilsService,
    cipherService: CipherService,
    vaultFilterService: VaultFilterService,
    eventService: EventService,
    totpService: TotpService,
    passwordRepromptService: PasswordRepromptService,
    modalService: ModalService,
    logService: LogService,
    stateService: StateService,
    organizationService: OrganizationService,
    tokenService: TokenService,
    private apiService: ApiService
  ) {
    super(
      searchService,
      i18nService,
      platformUtilsService,
      vaultFilterService,
      cipherService,
      eventService,
      totpService,
      stateService,
      passwordRepromptService,
      modalService,
      logService,
      organizationService,
      tokenService
    );
  }

  ngOnDestroy() {
    super.ngOnDestroy();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.organization != null) {
      await this.setOrganization();
    }
  }

  async setOrganization() {
    this.groups = (await this.apiService.getGroups(this.organization?.id)).data;
    this.allCiphers = await this.loadCiphers();
  }

  async loadCiphers(): Promise<CipherView[]> {
    if (this.organization?.canEditAnyCollection) {
      this.accessEvents = this.organization?.useEvents;
      return await this.cipherService.getAllFromApiForOrganization(this.organization?.id);
    } else {
      return (await this.cipherService.getAllDecrypted()).filter(
        (c) => c.organizationId === this.organization?.id
      );
    }
  }

  async refreshCollections(): Promise<void> {
    await this.vaultFilterService.reloadCollections();
    if (this.activeFilter.selectedCollectionNode) {
      this.activeFilter.selectedCollectionNode =
        await this.vaultFilterService.getCollectionNodeFromTree(
          this.activeFilter.selectedCollectionNode.node.id
        );
    }
  }

  async load(filter: (cipher: CipherView) => boolean = null, deleted = false) {
    this.deleted = deleted ?? false;
    await this.searchService.indexCiphers(this.organization?.id, this.allCiphers);
    await this.applyFilter(filter);
    this.loaded = true;
  }

  async refresh() {
    this.allCiphers = await this.loadCiphers();
    await this.refreshCollections();
    super.refresh();
  }

  async search(timeout: number = null) {
    await super.search(timeout, this.allCiphers);
  }

  events(c: CipherView) {
    this.onEventsClicked.emit(c);
  }

  protected showFixOldAttachments(c: CipherView) {
    return this.organization?.canEditAnyCollection && c.hasOldAttachments;
  }

  checkAll(select: boolean) {
    if (select) {
      this.checkAll(false);
    }

    const items: ItemRow[] = [...this.collections, ...this.ciphers];
    if (!items) {
      return;
    }

    const selectCount = select && items.length > MaxCheckedCount ? MaxCheckedCount : items.length;
    for (let i = 0; i < selectCount; i++) {
      this.checkRow(items[i], select);
    }
  }

  selectRow(item: ItemRow) {
    this.checkRow(item);
  }

  checkRow(item: ItemRow, select?: boolean) {
    if (item instanceof TreeNode && item.node.name == "Unassigned") {
      return;
    }
    item.checked = select ?? !item.checked;
  }

  get selectedCollections(): TreeNode<CollectionFilter>[] {
    if (!this.collections) {
      return [];
    }
    return this.collections.filter((c) => !!(c as ItemRow).checked);
  }

  get selectedCollectionIds(): string[] {
    return this.selectedCollections.map((c) => c.node.id);
  }

  // TODO: Connect to new collection modal
  async editCollectionInfo(c: CollectionView) {
    return;
  }

  // TODO: Connect to new collection modal
  async editCollectionAccess(c: CollectionView) {
    return;
  }

  async deleteCollection(collection: CollectionView) {
    if (!this.organization.canDeleteAssignedCollections) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("missingPermissions")
      );
      return;
    }
    const confirmed = await this.platformUtilsService.showDialog(
      this.i18nService.t("deleteCollectionConfirmation"),
      collection.name,
      this.i18nService.t("yes"),
      this.i18nService.t("no"),
      "warning"
    );
    if (!confirmed) {
      return false;
    }
    try {
      this.actionPromise = this.apiService.deleteCollection(this.organization?.id, collection.id);
      await this.actionPromise;
      this.platformUtilsService.showToast(
        "success",
        null,
        this.i18nService.t("deletedCollectionId", collection.name)
      );
      await this.refresh();
    } catch (e) {
      this.logService.error(e);
    }
  }

  async bulkDelete() {
    if (!(await this.repromptCipher())) {
      return;
    }

    const selectedCipherIds = this.selectedCipherIds;
    const selectedCollectionIds = this.deleted ? null : this.selectedCollectionIds;

    if (!selectedCipherIds?.length && !selectedCollectionIds?.length) {
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
        comp.cipherIds = selectedCipherIds;
        comp.collectionIds = selectedCollectionIds;
        comp.organization = this.organization;
        // eslint-disable-next-line rxjs-angular/prefer-takeuntil, rxjs/no-async-subscribe
        comp.onDeleted.subscribe(async () => {
          modal.close();
          await this.refresh();
        });
      }
    );
  }

  protected deleteCipherWithServer(id: string, permanent: boolean) {
    if (!this.organization?.canEditAnyCollection) {
      return super.deleteCipherWithServer(id, this.deleted);
    }
    return permanent
      ? this.apiService.deleteCipherAdmin(id)
      : this.apiService.putDeleteCipherAdmin(id);
  }
}
