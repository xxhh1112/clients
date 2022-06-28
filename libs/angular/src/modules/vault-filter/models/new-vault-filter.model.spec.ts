import { CipherType } from "@bitwarden/common/enums/cipherType";
import { CipherView } from "@bitwarden/common/models/view/cipherView";

import { Unassigned, VaultFilter, VaultFilterOptions } from "./new-vault-filter.model";

describe("VaultFilter", () => {
  describe("update", () => {
    it("should be equal when not updating any fields", () => {
      const filter = new VaultFilter();

      const result = filter.update({});

      expect(result).toEqual(filter);
    });

    it("should not be equal when updating fields", () => {
      const filter = new VaultFilter({ folder: "folderId" });

      const result = filter.update({ folder: "updatedFolderId" });

      expect(result).not.toEqual(filter);
    });

    it("should return filter with new field value when updating field", () => {
      const filter = new VaultFilter({ folder: "folderId" });

      const result = filter.update({ folder: "updatedFolderId" });

      expect(result.folder).toBe("updatedFolderId");
    });
  });

  describe("filterFunction", () => {
    it("should return true when filter is set to all statuses", () => {
      const cipher = createCipher();
      const filterFunction = createFilterFunction({ cipherStatus: "all" });

      const result = filterFunction(cipher);

      expect(result).toBe(true);
    });

    it("should return true when filter is set to favorites and cipher is favorite", () => {
      const cipher = createCipher({ favorite: true });
      const filterFunction = createFilterFunction({ cipherStatus: "favorites" });

      const result = filterFunction(cipher);

      expect(result).toBe(true);
    });

    it("should return false when filter is set to all and cipher is not favorite", () => {
      const cipher = createCipher({ favorite: false });
      const filterFunction = createFilterFunction({ cipherStatus: "favorites" });

      const result = filterFunction(cipher);

      expect(result).toBe(false);
    });

    it("should return true when filter is set to trash and cipher is deleted", () => {
      const cipher = createCipher({ deletedDate: new Date() });
      const filterFunction = createFilterFunction({ cipherStatus: "trash" });

      const result = filterFunction(cipher);

      expect(result).toBe(true);
    });

    it("should return false when filter is set to trash and cipher is not deleted", () => {
      const cipher = createCipher({ deletedDate: undefined });
      const filterFunction = createFilterFunction({ cipherStatus: "trash" });

      const result = filterFunction(cipher);

      expect(result).toBe(false);
    });

    it("should return true when filter matches cipher type", () => {
      const cipher = createCipher({ type: CipherType.Identity });
      const filterFunction = createFilterFunction({ cipherType: CipherType.Identity });

      const result = filterFunction(cipher);

      expect(result).toBe(true);
    });

    it("should return false when filter does not match cipher type", () => {
      const cipher = createCipher({ type: CipherType.Card });
      const filterFunction = createFilterFunction({ cipherType: CipherType.Identity });

      const result = filterFunction(cipher);

      expect(result).toBe(false);
    });

    it("should return true when filter matches folder id", () => {
      const cipher = createCipher({ folderId: "folderId" });
      const filterFunction = createFilterFunction({ folder: "folderId" });

      const result = filterFunction(cipher);

      expect(result).toBe(true);
    });

    it("should return true when filtering on unassigned folder and cipher does not have folder", () => {
      const cipher = createCipher({ folderId: undefined });
      const filterFunction = createFilterFunction({ folder: Unassigned });

      const result = filterFunction(cipher);

      expect(result).toBe(true);
    });

    it("should return false when filter does not match folder id", () => {
      const cipher = createCipher({ folderId: "folderId" });
      const filterFunction = createFilterFunction({ folder: "anotherFolderId" });

      const result = filterFunction(cipher);

      expect(result).toBe(false);
    });

    it("should return true when filter matches collection id", () => {
      const cipher = createCipher({ collectionIds: ["collectionId", "anotherId"] });
      const filterFunction = createFilterFunction({ collection: "collectionId" });

      const result = filterFunction(cipher);

      expect(result).toBe(true);
    });

    it("should return true when filtering on unassigned collection and cipher does not have any collections", () => {
      const cipher = createCipher({ collectionIds: [] });
      const filterFunction = createFilterFunction({ collection: Unassigned });

      const result = filterFunction(cipher);

      expect(result).toBe(true);
    });

    it("should return false when filter does not match collection id", () => {
      const cipher = createCipher({ collectionIds: ["collectionId", "anotherId"] });
      const filterFunction = createFilterFunction({ collection: "nonMatchingId" });

      const result = filterFunction(cipher);

      expect(result).toBe(false);
    });

    it("should return true when filter matches organization id", () => {
      const cipher = createCipher({ organizationId: "organizationId" });
      const filterFunction = createFilterFunction({ organization: "organizationId" });

      const result = filterFunction(cipher);

      expect(result).toBe(true);
    });

    it("should return true when filtering on unassigned organization and cipher does not have any organization", () => {
      const cipher = createCipher({ organizationId: null });
      const filterFunction = createFilterFunction({ organization: Unassigned });

      const result = filterFunction(cipher);

      expect(result).toBe(true);
    });

    it("should return false when filter does not match organization id", () => {
      const cipher = createCipher({ organizationId: "organizationId" });
      const filterFunction = createFilterFunction({ organization: "anotherOrganizationId" });

      const result = filterFunction(cipher);

      expect(result).toBe(false);
    });
  });
});

function createFilterFunction(options: Partial<VaultFilterOptions> = {}) {
  return new VaultFilter(options).filterFunction;
}

function createCipher(options: Partial<CipherView> = {}) {
  const cipher = new CipherView();

  cipher.favorite = options.favorite ?? false;
  cipher.deletedDate = options.deletedDate;
  cipher.type = options.type;
  cipher.folderId = options.folderId;
  cipher.collectionIds = options.collectionIds;
  cipher.organizationId = options.organizationId;

  return cipher;
}
