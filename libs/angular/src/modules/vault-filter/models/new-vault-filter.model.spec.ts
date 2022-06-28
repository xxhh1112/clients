import { VaultFilter } from "./new-vault-filter.model";

describe("VaultFilter", () => {
  describe("update", () => {
    it("should be equal when not updating any row", () => {
      const filter = new VaultFilter();

      const result = filter.update({});

      expect(result).toEqual(filter);
    });
  });
});
