import { CipherView } from "@bitwarden/common/models/view/cipherView";

import { VaultFilter } from "./new-vault-filter.model";

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
      const filter = new VaultFilter({ status: "favorites" });
      const cipher = new CipherView();
      const filterFunction = filter.filterFunction;

      const result = filterFunction(cipher);

      expect(result).toBe(true);
    });
  });
});
