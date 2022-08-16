import { Injectable } from "@angular/core";
import { firstValueFrom, from, mergeMap, Observable, of } from "rxjs";

import { CipherService } from "@bitwarden/common/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { FolderService } from "@bitwarden/common/abstractions/folder/folder.service.abstraction";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { OrganizationService } from "@bitwarden/common/abstractions/organization.service";
import { PolicyService } from "@bitwarden/common/abstractions/policy/policy.service.abstraction";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { PolicyType } from "@bitwarden/common/enums/policyType";
import { ServiceUtils } from "@bitwarden/common/misc/serviceUtils";
import { Organization } from "@bitwarden/common/models/domain/organization";
import { TreeNode } from "@bitwarden/common/models/domain/treeNode";
import { CollectionView } from "@bitwarden/common/models/view/collectionView";
import { FolderView } from "@bitwarden/common/models/view/folderView";

import { CipherTypeFilter } from "../models/cipher-filter.model";
import { CollectionFilter } from "../models/collection-filter.model";
import { FolderFilter } from "../models/folder-filter.model";
import { OrganizationFilter } from "../models/organization-filter.model";

const NestingDelimiter = "/";

@Injectable()
export class VaultFilterService {
  constructor(
    protected stateService: StateService,
    protected organizationService: OrganizationService,
    protected folderService: FolderService,
    protected cipherService: CipherService,
    protected collectionService: CollectionService,
    protected policyService: PolicyService,
    protected i18nService: I18nService
  ) {}

  async storeCollapsedFilterNodes(collapsedFilterNodes: Set<string>): Promise<void> {
    await this.stateService.setCollapsedGroupings(Array.from(collapsedFilterNodes));
  }

  async buildCollapsedFilterNodes(): Promise<Set<string>> {
    return new Set(await this.stateService.getCollapsedGroupings());
  }

  async buildOrganizations(): Promise<Observable<TreeNode<OrganizationFilter>>> {
    const orgs = (await this.organizationService.getAll()) as OrganizationFilter[];
    const head = new Organization() as OrganizationFilter;
    const headNode = new TreeNode<OrganizationFilter>(head, "allVaults", null, "AllVaults");
    if (!(await this.checkForSingleOrganizationPolicy())) {
      const myVault = new Organization() as OrganizationFilter;
      myVault.id = null;
      myVault.icon = "bwi-user";
      myVault.enabled = true;
      myVault.hideOptions = true;
      myVault.hideOptions = true;
      const myVaultNode = new TreeNode<OrganizationFilter>(
        myVault,
        this.i18nService.t("myVault"),
        null
      );
      headNode.children.push(myVaultNode);
    }
    orgs.forEach((filter) => {
      filter.icon = "bwi-business";
      const node = new TreeNode<OrganizationFilter>(filter, filter.name, head);
      headNode.children.push(node);
    });
    return of(headNode);
  }

  buildNestedFolders(organizationId?: string): Observable<TreeNode<FolderFilter>> {
    const transformation = async (storedFolders: FolderView[]) => {
      let folders: FolderView[];
      if (organizationId != null) {
        const ciphers = await this.cipherService.getAllDecrypted();
        const orgCiphers = ciphers.filter((c) => c.organizationId == organizationId);
        folders = storedFolders.filter(
          (f) =>
            orgCiphers.filter((oc) => oc.folderId == f.id).length > 0 ||
            ciphers.filter((c) => c.folderId == f.id).length < 1
        );
      } else {
        folders = storedFolders;
      }
      return await this.getAllFoldersNested(folders);
    };

    return this.folderService.folderViews$.pipe(
      mergeMap((folders) => from(transformation(folders)))
    );
  }

  async buildCollections(organizationId?: string): Promise<Observable<TreeNode<CollectionFilter>>> {
    const storedCollections = await this.collectionService.getAllDecrypted();
    let collections: CollectionView[];
    if (organizationId != null) {
      collections = storedCollections.filter((c) => c.organizationId === organizationId);
    } else {
      collections = storedCollections;
    }
    return of(await this.collectionService.getAllNested(collections));
  }

  buildNestedTypes(
    head: CipherTypeFilter,
    array: CipherTypeFilter[]
  ): Observable<TreeNode<CipherTypeFilter>> {
    const headNode = new TreeNode<CipherTypeFilter>(head, "allItems", null, "AllItems");
    array.forEach((filter) => {
      const node = new TreeNode<CipherTypeFilter>(filter, filter.name, head);
      headNode.children.push(node);
    });
    return of(headNode);
  }

  buildTrash() {
    return of(
      new TreeNode<CipherTypeFilter>(
        {
          id: "trash",
          name: "trash",
          type: "trash",
          icon: "bwi-trash",
        },
        "trash",
        null,
        "trash"
      )
    );
  }

  async checkForSingleOrganizationPolicy(): Promise<boolean> {
    return await this.policyService.policyAppliesToUser(PolicyType.SingleOrg);
  }

  async checkForPersonalOwnershipPolicy(): Promise<boolean> {
    return await this.policyService.policyAppliesToUser(PolicyType.PersonalOwnership);
  }

  protected async getAllFoldersNested(folders: FolderView[]): Promise<TreeNode<FolderFilter>> {
    const nodes: TreeNode<FolderFilter>[] = [];
    folders.forEach((f) => {
      const folderCopy = new FolderView() as FolderFilter;
      folderCopy.id = f.id;
      folderCopy.revisionDate = f.revisionDate;
      folderCopy.icon = "bwi-folder";
      const parts = f.name != null ? f.name.replace(/^\/+|\/+$/g, "").split(NestingDelimiter) : [];
      ServiceUtils.nestedTraverse(nodes, 0, parts, folderCopy, null, NestingDelimiter);
    });

    const head = new FolderView() as FolderFilter;
    const headNode = new TreeNode<FolderFilter>(head, "folders", null, "AllFolders");
    nodes.forEach((n) => {
      n.parent = head;
      headNode.children.push(n);
    });
    return headNode;
  }

  async getFolderNested(id: string): Promise<TreeNode<FolderFilter>> {
    const folders = await this.getAllFoldersNested(
      await firstValueFrom(this.folderService.folderViews$)
    );
    return ServiceUtils.getTreeNodeObject(folders, id) as TreeNode<FolderFilter>;
  }
}
