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
      const filter = new VaultFilter({ folderId: "folderId" });

      const result = filter.update({ folderId: "updatedFolderId" });

      expect(result).not.toEqual(filter);
    });

    it("should return filter with new field value when updating field", () => {
      const filter = new VaultFilter({ folderId: "folderId" });

      const result = filter.update({ folderId: "updatedFolderId" });

      expect(result.folderId).toBe("updatedFolderId");
    });
  });

  describe("filterFunction", () => {
    it("should return true when filter is set to all statuses", () => {
      const cipher = createCipher();
      const filterFunction = createFilterFunction({ status: "all" });

      const result = filterFunction(cipher);

      expect(result).toBe(true);
    });

    it("should return true when filter is set to favorites and cipher is favorite", () => {
      const cipher = createCipher({ favorite: true });
      const filterFunction = createFilterFunction({ status: "favorites" });

      const result = filterFunction(cipher);

      expect(result).toBe(true);
    });

    it("should return false when filter is set to all and cipher is not favorite", () => {
      const cipher = createCipher({ favorite: false });
      const filterFunction = createFilterFunction({ status: "favorites" });

      const result = filterFunction(cipher);

      expect(result).toBe(false);
    });

    it("should return true when filter is set to trash and cipher is deleted", () => {
      const cipher = createCipher({ deletedDate: new Date() });
      const filterFunction = createFilterFunction({ status: "trash" });

      const result = filterFunction(cipher);

      expect(result).toBe(true);
    });

    it("should return false when filter is set to trash and cipher is not deleted", () => {
      const cipher = createCipher({ deletedDate: undefined });
      const filterFunction = createFilterFunction({ status: "trash" });

      const result = filterFunction(cipher);

      expect(result).toBe(false);
    });

    it("should return true when filter matches cipher type", () => {
      const cipher = createCipher({ type: CipherType.Identity });
      const filterFunction = createFilterFunction({ type: CipherType.Identity });

      const result = filterFunction(cipher);

      expect(result).toBe(true);
    });

    it("should return false when filter does not match cipher type", () => {
      const cipher = createCipher({ type: CipherType.Card });
      const filterFunction = createFilterFunction({ type: CipherType.Identity });

      const result = filterFunction(cipher);

      expect(result).toBe(false);
    });

    it("should return true when filter matches folder id", () => {
      const cipher = createCipher({ folderId: "folderId" });
      const filterFunction = createFilterFunction({ folderId: "folderId" });

      const result = filterFunction(cipher);

      expect(result).toBe(true);
    });

    it("should return true when filtering on unassigned folder and cipher does not have folder", () => {
      const cipher = createCipher({ folderId: undefined });
      const filterFunction = createFilterFunction({ folderId: Unassigned });

      const result = filterFunction(cipher);

      expect(result).toBe(true);
    });

    it("should return false when filter does not match folder id", () => {
      const cipher = createCipher({ folderId: "folderId" });
      const filterFunction = createFilterFunction({ folderId: "anotherFolderId" });

      const result = filterFunction(cipher);

      expect(result).toBe(false);
    });

    it("should return true when filter matches collection id", () => {
      const cipher = createCipher({ collectionIds: ["collectionId", "anotherId"] });
      const filterFunction = createFilterFunction({ collectionId: "collectionId" });

      const result = filterFunction(cipher);

      expect(result).toBe(true);
    });

    it("should return true when filtering on unassigned collection and cipher does not have any collections", () => {
      const cipher = createCipher({ collectionIds: [] });
      const filterFunction = createFilterFunction({ collectionId: Unassigned });

      const result = filterFunction(cipher);

      expect(result).toBe(true);
    });

    it("should return false when filter does not match collection id", () => {
      const cipher = createCipher({ collectionIds: ["collectionId", "anotherId"] });
      const filterFunction = createFilterFunction({ collectionId: "nonMatchingId" });

      const result = filterFunction(cipher);

      expect(result).toBe(false);
    });

    it("should return true when filter matches organization id", () => {
      const cipher = createCipher({ organizationId: "organizationId" });
      const filterFunction = createFilterFunction({ organizationId: "organizationId" });

      const result = filterFunction(cipher);

      expect(result).toBe(true);
    });

    it("should return true when filtering on unassigned organization and cipher does not have any organization", () => {
      const cipher = createCipher({ organizationId: null });
      const filterFunction = createFilterFunction({ organizationId: Unassigned });

      const result = filterFunction(cipher);

      expect(result).toBe(true);
    });

    it("should return false when filter does not match organization id", () => {
      const cipher = createCipher({ organizationId: "organizationId" });
      const filterFunction = createFilterFunction({ organizationId: "anotherOrganizationId" });

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
