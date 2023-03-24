// eslint-disable-next-line import/no-restricted-paths -- Needed to print log messages
import { LogService } from "../abstractions/log.service";
// eslint-disable-next-line import/no-restricted-paths -- Needed to interface with storage locations
import { AbstractStorageService } from "../abstractions/storage.service";

import { MigrationBuilder } from "./migration-builder";
import { MigrationHelper } from "./migration-helper";
import { FixPremiumMigrator } from "./migrations/3-fix-premium";
import { RemoveEverBeenUnlockedMigrator } from "./migrations/4-remove-ever-been-unlocked";
import { AddKeyTypeToOrgKeysMigrator } from "./migrations/5-add-key-type-to-org-keys";
import { RemoveLegacyEtmKeyMigrator } from "./migrations/6-remove-legacy-etm-key";
import { MoveStateVersionMigrator } from "./migrations/7-move-state-version";
import { MinVersionMigrator } from "./migrations/min-version";

export const MIN_VERSION = 2;
export type MinVersion = typeof MIN_VERSION;

export const builder: MigrationBuilder<number> = MigrationBuilder.create()
  .with(MinVersionMigrator)
  .with(FixPremiumMigrator, 2, 3)
  .with(RemoveEverBeenUnlockedMigrator, 3, 4)
  .with(AddKeyTypeToOrgKeysMigrator, 4, 5)
  .with(RemoveLegacyEtmKeyMigrator, 5, 6)
  .with(MoveStateVersionMigrator, 6, 7);

export async function migrate(
  storageService: AbstractStorageService,
  logService: LogService
): Promise<void> {
  const migrationHelper = new MigrationHelper(
    await currentVersion(storageService, logService),
    storageService,
    logService
  );
  if (migrationHelper.currentVersion < 0) {
    // Cannot determine state, assuming empty so we don't repeatedly apply a migration.
    return;
  }
  builder.migrate(migrationHelper);
}

export async function currentVersion(stateService: AbstractStorageService, logService: LogService) {
  let state = await stateService.get<number>("stateVersion");
  if (state == null) {
    // Pre v7
    state = (await stateService.get<{ stateVersion: number }>("global"))?.stateVersion;
  }
  if (state == null) {
    logService.info("No state version found, assuming empty state.");
    return -1;
  }
  logService.info(`State version: ${state}`);
  return state;
}
