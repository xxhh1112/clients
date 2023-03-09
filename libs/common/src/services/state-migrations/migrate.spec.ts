import { builder } from "./migrate";
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
    expect(builder()).toBeInstanceOf(MigrationBuilder);
  });
});
