import { mock, MockProxy } from "jest-mock-extended";
import { firstValueFrom, ReplaySubject } from "rxjs";

import { CipherService } from "@bitwarden/common/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { FolderService } from "@bitwarden/common/abstractions/folder/folder.service.abstraction";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { OrganizationService } from "@bitwarden/common/abstractions/organization.service";
import { PolicyService } from "@bitwarden/common/abstractions/policy/policy.service.abstraction";
import { PolicyType } from "@bitwarden/common/enums/policyType";
import { Organization } from "@bitwarden/common/models/domain/organization";
import { CipherView } from "@bitwarden/common/models/view/cipherView";
import { CollectionView } from "@bitwarden/common/models/view/collectionView";
import { FolderView } from "@bitwarden/common/models/view/folderView";

import { StateService } from "src/app/core";

import { VaultFilterService } from "./vault-filter.service";

describe("vault filter service", () => {
  let vaultFilterService: VaultFilterService;

  let stateService: MockProxy<StateService>;
  let organizationService: MockProxy<OrganizationService>;
  let folderService: MockProxy<FolderService>;
  let cipherService: MockProxy<CipherService>;
  let collectionService: MockProxy<CollectionService>;
  let policyService: MockProxy<PolicyService>;
  let i18nService: MockProxy<I18nService>;
  let folderViews: ReplaySubject<FolderView[]>;

  beforeEach(() => {
    stateService = mock<StateService>();
    organizationService = mock<OrganizationService>();
    folderService = mock<FolderService>();
    cipherService = mock<CipherService>();
    collectionService = mock<CollectionService>();
    policyService = mock<PolicyService>();
    i18nService = mock<I18nService>();

    folderViews = new ReplaySubject<FolderView[]>(1);

    folderService.folderViews$ = folderViews;

    vaultFilterService = new VaultFilterService(
      stateService,
      organizationService,
      folderService,
      cipherService,
      collectionService,
      policyService,
      i18nService
    );
  });

  describe("collapsed filter nodes", () => {
    const nodes = new Set(["1", "2"]);
    it("updates observable when saving", (complete) => {
      vaultFilterService.collapsedFilterNodes$.subscribe((value) => {
        if (value === nodes) {
          complete();
        }
      });

      vaultFilterService.storeCollapsedFilterNodes(nodes);
    });

    it("loads from state on initialization", async () => {
      stateService.getCollapsedGroupings.mockResolvedValue(["1", "2"]);

      await expect(firstValueFrom(vaultFilterService.collapsedFilterNodes$)).resolves.toEqual(
        nodes
      );
    });
  });

  describe("organizations", () => {
    beforeEach(() => {
      const storedOrgs = [createOrganization("1", "org1"), createOrganization("2", "org2")];
      organizationService.getAll.mockResolvedValue(storedOrgs);
      vaultFilterService.reloadOrganizations();
    });

    it("returns a nested tree", async () => {
      const tree = await firstValueFrom(vaultFilterService.organizationTree$);

      expect(tree.children.length).toBe(3);
      expect(tree.children.find((o) => o.node.name === "org1"));
      expect(tree.children.find((o) => o.node.name === "org2"));
    });

    it("hides My Vault if personal ownership policy is enabled", async () => {
      policyService.policyAppliesToUser
        .calledWith(PolicyType.PersonalOwnership)
        .mockResolvedValue(true);
      vaultFilterService.reloadOrganizations();

      const tree = await firstValueFrom(vaultFilterService.organizationTree$);

      expect(tree.children.length).toBe(2);
      expect(!tree.children.find((o) => o.node.id === "MyVault"));
    });

    it("returns 1 organization and My Vault if single organization policy is enabled", async () => {
      policyService.policyAppliesToUser.calledWith(PolicyType.SingleOrg).mockResolvedValue(true);
      vaultFilterService.reloadOrganizations();

      const tree = await firstValueFrom(vaultFilterService.organizationTree$);

      expect(tree.children.length).toBe(2);
      expect(tree.children.find((o) => o.node.name === "org1"));
      expect(tree.children.find((o) => o.node.id === "MyVault"));
    });

    it("returns 1 organization if both single organization and personal ownership policies are enabled", async () => {
      policyService.policyAppliesToUser.calledWith(PolicyType.SingleOrg).mockResolvedValue(true);
      policyService.policyAppliesToUser
        .calledWith(PolicyType.PersonalOwnership)
        .mockResolvedValue(true);
      vaultFilterService.reloadOrganizations();

      const tree = await firstValueFrom(vaultFilterService.organizationTree$);

      expect(tree.children.length).toBe(1);
      expect(tree.children.find((o) => o.node.name === "org1"));
    });
  });

  describe("folders", () => {
    describe("filtered folders", () => {
      it("returns folders filtered by current organization", async () => {
        // Org must be updated before folderService else the subscription uses the null org default value
        vaultFilterService.updateOrganizationFilter(createOrganization("org test id", "Test Org"));

        const storedCiphers = [
          createCipherView("1", "org test id", "folder test id"),
          createCipherView("2", "non matching org id", "non matching folder id"),
        ];
        cipherService.getAllDecrypted.mockResolvedValue(storedCiphers);

        const storedFolders = [
          createFolderView("folder test id", "test"),
          createFolderView("non matching folder id", "test2"),
        ];
        folderViews.next(storedFolders);

        await expect(firstValueFrom(vaultFilterService.filteredFolders$)).resolves.toEqual([
          createFolderView("folder test id", "test"),
        ]);
      });
    });

    describe("folder tree", () => {
      it("returns a nested tree", async () => {
        const storedFolders = [
          createFolderView("Folder 1 Id", "Folder 1"),
          createFolderView("Folder 2 Id", "Folder 1/Folder 2"),
          createFolderView("Folder 3 Id", "Folder 1/Folder 3"),
        ];
        folderViews.next(storedFolders);

        const result = await firstValueFrom(vaultFilterService.folderTree$);

        expect(result.children[0].node.id === "Folder 1 Id");
        expect(result.children[0].children.find((c) => c.node.id === "Folder 2 Id"));
        expect(result.children[0].children.find((c) => c.node.id === "Folder 3 Id"));
      }, 10000);
    });
  });

  describe("collections", () => {
    describe("filtered collections", () => {
      it("returns collections filtered by current organization", async () => {
        vaultFilterService.updateOrganizationFilter(createOrganization("org test id", "Test Org"));

        const storedCollections = [
          createCollectionView("1", "collection 1", "org test id"),
          createCollectionView("2", "collection 2", "non matching org id"),
        ];
        collectionService.getAllDecrypted.mockResolvedValue(storedCollections);
        vaultFilterService.reloadCollections();

        await expect(firstValueFrom(vaultFilterService.filteredCollections$)).resolves.toEqual([
          createCollectionView("1", "collection 1", "org test id"),
        ]);
      });
    });

    describe("collection tree", () => {
      it("returns a nested tree", async () => {
        const storedCollections = [
          createCollectionView("Collection 1 Id", "Collection 1", "org test id"),
          createCollectionView("Collection 2 Id", "Collection 1/Collection 2", "org test id"),
          createCollectionView("Collection 3 Id", "Collection 1/Collection 3", "org test id"),
        ];
        collectionService.getAllDecrypted.mockResolvedValue(storedCollections);
        vaultFilterService.reloadCollections();

        const result = await firstValueFrom(vaultFilterService.collectionTree$);

        expect(result.children[0].node.id === "Collection 1 Id");
        expect(result.children[0].children.find((c) => c.node.id === "Collection 2 Id"));
        expect(result.children[0].children.find((c) => c.node.id === "Collection 3 Id"));
      });
    });
  });

  function createOrganization(id: string, name: string) {
    const org = new Organization();
    org.id = id;
    org.name = name;
    org.identifier = name;
    return org;
  }

  function createCipherView(id: string, orgId: string, folderId: string) {
    const cipher = new CipherView();
    cipher.id = id;
    cipher.organizationId = orgId;
    cipher.folderId = folderId;
    return cipher;
  }

  function createFolderView(id: string, name: string): FolderView {
    const folder = new FolderView();
    folder.id = id;
    folder.name = name;
    return folder;
  }

  function createCollectionView(id: string, name: string, orgId: string): CollectionView {
    const collection = new CollectionView();
    collection.id = id;
    collection.name = name;
    collection.organizationId = orgId;
    return collection;
  }
});
