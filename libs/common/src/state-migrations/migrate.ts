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

export async function migrate(storageService: AbstractStorageService): Promise<void> {
  const migrationHelper = new MigrationHelper(await currentVersion(storageService), storageService);
  if (migrationHelper.currentVersion < 0) {
    // Nothing to migrate
    return;
  }
  builder.migrate(migrationHelper);
}

export async function currentVersion(stateService: AbstractStorageService) {
  let state = await stateService.get<number>("stateVersion");
  if (state == null) {
    // Pre v7
    state = (await stateService.get<{ stateVersion: number }>("global"))?.stateVersion;
  }
  return state ?? -1;
}
