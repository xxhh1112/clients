import { JsonObject } from "type-fest";

import { MigrationHelper } from "../migration-helper";
import { Migrator } from "../migrator";

export class MoveStateVersionMigrator extends Migrator<6, 7> {
  fromVersion: 6 = 6;
  toVersion: 7 = 7;

  shouldMigrate(helper: MigrationHelper): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  async migrate(helper: MigrationHelper): Promise<void> {
    const global = await helper.get<{ stateVersion: number }>("global");
    if (global.stateVersion) {
      await helper.set("stateVersion", global.stateVersion);
      delete global.stateVersion;
      await helper.set("global", global);
    } else {
      throw new Error("Migration failed, state version not found");
    }
  }

  async rollback(helper: MigrationHelper): Promise<void> {
    const version = await helper.get<number>("stateVersion");
    const global = await helper.get<JsonObject>("global");
    await helper.set("global", { ...global, stateVersion: version });
  }
}
