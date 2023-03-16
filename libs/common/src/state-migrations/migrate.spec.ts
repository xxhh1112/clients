import { mock, MockProxy } from "jest-mock-extended";

// eslint-disable-next-line import/no-restricted-paths -- Needed to interface with storage locations
import { AbstractStorageService } from "../abstractions/storage.service";

import { builder, currentVersion, migrate } from "./migrate";
import { MigrationBuilder } from "./migration-builder";
import { MigrationHelper } from "./migration-helper";
import { Migrator } from "./migrator";

describe("migrate", () => {
  class TestMigrator extends Migrator<0, 1> {
    async migrate(helper: MigrationHelper): Promise<void> {
      await helper.set("test", "test");
    }

    async rollback(helper: MigrationHelper): Promise<void> {
      await helper.set("test", "rollback");
    }
  }

  class TestBadMigrator extends Migrator<1, 0> {
    async migrate(helper: MigrationHelper): Promise<void> {
      await helper.set("test", "test");
    }

    async rollback(helper: MigrationHelper): Promise<void> {
      await helper.set("test", "rollback");
    }
  }

  it("should throw if instantiated incorrectly", () => {
    expect(() => MigrationBuilder.create().with(TestMigrator, null, null)).toThrow();
    expect(() =>
      MigrationBuilder.create().with(TestMigrator, 0, 1).with(TestBadMigrator, 1, 0)
    ).toThrow();
  });

  it("should load migration builder", () => {
    expect(builder).toBeInstanceOf(MigrationBuilder);
  });

  it("should not run migrations if state is empty", async () => {
    const storage = mock<AbstractStorageService>();
    storage.get.mockReturnValueOnce(null);
    const migrateSpy = jest.spyOn(builder["migrations"][0].migrator, "migrate");
    await migrate(storage);
    expect(migrateSpy).not.toHaveBeenCalled();
  });
});

describe("currentVersion", () => {
  let storage: MockProxy<AbstractStorageService>;

  beforeEach(() => {
    storage = mock();
  });

  it("should return -1 if no version", async () => {
    storage.get.mockReturnValueOnce(null);
    expect(await currentVersion(storage)).toEqual(-1);
  });

  it("should return version", async () => {
    storage.get.calledWith("stateVersion").mockReturnValueOnce(1 as any);
    expect(await currentVersion(storage)).toEqual(1);
  });

  it("should return version from global", async () => {
    storage.get.calledWith("stateVersion").mockReturnValueOnce(null);
    storage.get.calledWith("global").mockReturnValueOnce({ stateVersion: 1 } as any);
    expect(await currentVersion(storage)).toEqual(1);
  });

  it("should prefer root version to global", async () => {
    storage.get.calledWith("stateVersion").mockReturnValue(1 as any);
    storage.get.calledWith("global").mockReturnValue({ stateVersion: 2 } as any);
    expect(await currentVersion(storage)).toEqual(1);
  });
});
