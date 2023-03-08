import { mock, MockProxy } from "jest-mock-extended";

import { MigrationHelper } from "../migration-helper";

import { MoveStateVersionMigrator } from "./7-move-state-version";

describe("moveStateVersion", () => {
  let helper: MockProxy<MigrationHelper>;
  let sut: MoveStateVersionMigrator;

  beforeEach(() => {
    helper = mock();

    sut = new MoveStateVersionMigrator();
  });

  describe("migrate", () => {
    it("should move state version to root", async () => {
      helper.get.mockResolvedValueOnce({ stateVersion: 6, other: "stuff" });
      await sut.migrate(helper);
      expect(helper.set).toHaveBeenCalledWith("stateVersion", 6);
    });

    it("should remove state version from global", async () => {
      helper.get.mockResolvedValueOnce({ stateVersion: 6, other: "stuff" });
      await sut.migrate(helper);
      expect(helper.set).toHaveBeenCalledWith("global", { other: "stuff" });
    });

    it("should throw if state version not found", async () => {
      helper.get.mockResolvedValueOnce({ other: "stuff" });
      await expect(sut.migrate(helper)).rejects.toThrow(
        "Migration failed, state version not found"
      );
    });
  });

  describe("rollback", () => {
    it("should move state version to global", async () => {
      helper.get.mockResolvedValueOnce(6);
      helper.get.mockResolvedValueOnce({ other: "stuff" });
      await sut.rollback(helper);
      expect(helper.set).toHaveBeenCalledWith("global", { stateVersion: 6, other: "stuff" });
    });
  });
});
