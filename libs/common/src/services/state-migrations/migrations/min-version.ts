import { MigrationHelper } from "../migration-helper";
import { VersionMigrator } from "../migrator";

export const MIN_VERSION = 6;
export type MinVersion = 6;
export const MIN_VERSION_ERROR = `Your local data is too old to be migrated.`;

export class MinVersionMigrator extends VersionMigrator<MinVersion, MinVersion> {
  async migrate(helper: MigrationHelper): Promise<void> {
    if (helper.currentVersion < MIN_VERSION) {
      throw new Error(MIN_VERSION_ERROR);
    }
  }
}
