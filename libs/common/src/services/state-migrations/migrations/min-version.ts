import { MinVersion, MIN_VERSION } from "..";
import { MigrationHelper } from "../migration-helper";
import { IRREVERSIBLE, Migrator } from "../migrator";

export function minVersionError(current: number) {
  return `Your local data is too old to be migrated. Your current state version is ${current}, but minimum version is ${MIN_VERSION}.`;
}

export class MinVersionMigrator extends Migrator<MinVersion, MinVersion> {
  fromVersion: 6;
  toVersion: 6;

  async migrate(helper: MigrationHelper): Promise<void> {
    if (helper.currentVersion < MIN_VERSION) {
      throw new Error(minVersionError(helper.currentVersion));
    }
  }
  async rollback(helper: MigrationHelper): Promise<void> {
    throw IRREVERSIBLE;
  }
}
