import { MockProxy, mock } from "jest-mock-extended";

import { AbstractStorageService } from "../../../abstractions/storage.service";
import { MigrationHelper } from "../migration-helper";

import { MinVersionMigrator } from "./min-version";

describe("MinVersionMigrator", () => {
  let storage: MockProxy<AbstractStorageService>;
  let helper: MigrationHelper;
  let sut: MinVersionMigrator;

  beforeEach(() => {
    storage = mock();
    helper = new MigrationHelper(6, storage);
    sut = new MinVersionMigrator();
  });

  describe("shouldMigrate", () => {
    it("should return true if current version is less than min version", async () => {
      helper.currentVersion = 5;
      expect(await sut.shouldMigrate(helper)).toBe(true);
    });

    it("should return false if current version is greater than min version", async () => {
      helper.currentVersion = 7;
      expect(await sut.shouldMigrate(helper)).toBe(false);
    });
  });
});
