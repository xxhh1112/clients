import { CipherView } from "@bitwarden/common/models/view/cipherView";

import { VaultFilter, VaultFilterOptions } from "./new-vault-filter.model";

describe("VaultFilter", () => {
  describe("update", () => {
    it("should be equal when not updating any fields", () => {
      const filter = new VaultFilter();

      const result = filter.update({});

      expect(result).toEqual(filter);
    });

    it("should not be equal when updating fields", () => {
      const filter = new VaultFilter({ selectedFolder: true });

      const result = filter.update({ selectedFolder: false });

      expect(result).not.toEqual(filter);
    });

    it("should return filter with new field value when updating field", () => {
      const filter = new VaultFilter({ selectedFolder: false });

      const result = filter.update({ selectedFolder: true });

      expect(result.selectedFolder).toBe(true);
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
  });
});

function createFilterFunction(options: Partial<VaultFilterOptions> = {}) {
  return new VaultFilter(options).filterFunction;
}

function createCipher(options: Partial<CipherView> = {}) {
  const cipher = new CipherView();

  cipher.favorite = options.favorite ?? false;
  cipher.deletedDate = options.deletedDate;

  return cipher;
}
