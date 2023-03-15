import { MockProxy } from "jest-mock-extended";

import { MigrationHelper } from "../migration-helper";
import { mockMigrationHelper } from "../migration-helper.spec";

import { MoveStateVersionMigrator } from "./7-move-state-version";

function migrateExampleJSON() {
  return {
    global: {
      stateVersion: 6,
      otherStuff: "otherStuff",
    },
    otherStuff: "otherStuff",
  };
}

function rollbackExampleJSON() {
  return {
    global: {
      otherStuff: "otherStuff",
    },
    stateVersion: 7,
    otherStuff: "otherStuff",
  };
}

describe("moveStateVersion", () => {
  let helper: MockProxy<MigrationHelper>;
  let sut: MoveStateVersionMigrator;

  describe("migrate", () => {
    beforeEach(() => {
      helper = mockMigrationHelper(migrateExampleJSON());
      sut = new MoveStateVersionMigrator(6, 7);
    });

    it("should move state version to root", async () => {
      await sut.migrate(helper);
      expect(helper.set).toHaveBeenCalledWith("stateVersion", 6);
    });

    it("should remove state version from global", async () => {
      await sut.migrate(helper);
      expect(helper.set).toHaveBeenCalledWith("global", {
        otherStuff: "otherStuff",
      });
    });

    it("should throw if state version not found", async () => {
      helper.get.mockReturnValue({ otherStuff: "otherStuff" } as any);
      await expect(sut.migrate(helper)).rejects.toThrow(
        "Migration failed, state version not found"
      );
    });

    it("should update version up", async () => {
      await sut.updateVersion(helper, "up");

      expect(helper.set).toHaveBeenCalledTimes(1);
      expect(helper.set).toHaveBeenCalledWith("stateVersion", 7);
    });
  });

  describe("rollback", () => {
    beforeEach(() => {
      helper = mockMigrationHelper(rollbackExampleJSON());
      sut = new MoveStateVersionMigrator(6, 7);
    });

    it("should move state version to global", async () => {
      await sut.rollback(helper);
      expect(helper.set).toHaveBeenCalledWith("global", {
        stateVersion: 7,
        otherStuff: "otherStuff",
      });
      expect(helper.set).toHaveBeenCalledWith("stateVersion", undefined);
    });

    it("should update version down", async () => {
      await sut.updateVersion(helper, "down");

      expect(helper.set).toHaveBeenCalledTimes(1);
      expect(helper.set).toHaveBeenCalledWith("global", {
        stateVersion: 6,
        otherStuff: "otherStuff",
      });
    });
  });
});
