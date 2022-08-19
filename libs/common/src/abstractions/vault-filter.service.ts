import { Observable } from "rxjs";

import { CipherTypeFilter } from "@bitwarden/angular/src/vault/vault-filter/models/cipher-filter.model";
import { FolderFilter } from "@bitwarden/angular/src/vault/vault-filter/models/folder-filter.model";
import { OrganizationFilter } from "@bitwarden/angular/src/vault/vault-filter/models/organization-filter.model";
import { CollectionFilter } from "@bitwarden/angular/vault/vault-filter/models/collection-filter.model";

import { Organization } from "../models/domain/organization";
import { TreeNode } from "../models/domain/treeNode";

export abstract class VaultFilterService {
  collapsedFilterNodes$: Observable<Set<string>>;
  buildCollapsedFilterNodes: () => Promise<Set<string>>;
  storeCollapsedFilterNodes: (collapsedFilterNodes: Set<string>) => Promise<void>;
  buildNestedOrganizations: () => Promise<Observable<TreeNode<OrganizationFilter>>>;
  buildNestedFolders: (organizationId?: string) => Observable<TreeNode<FolderFilter>>;
  buildCollections: (org?: Organization) => Promise<Observable<TreeNode<CollectionFilter>>>;
  buildNestedTypes: (
    head: CipherTypeFilter,
    array: CipherTypeFilter[]
  ) => Observable<TreeNode<CipherTypeFilter>>;
  buildTrash: () => Observable<TreeNode<CipherTypeFilter>>;
  checkForSingleOrganizationPolicy: () => Promise<boolean>;
  checkForPersonalOwnershipPolicy: () => Promise<boolean>;
  getFolderNested: (id: string) => Promise<TreeNode<FolderFilter>>;
  ensureVaultFiltersAreExpanded: () => Promise<void>;
}
