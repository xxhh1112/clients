import { AbstractStorageService } from "../../abstractions/storage.service";

import { MigrationBuilder } from "./migration-builder";
import { MigrationHelper } from "./migration-helper";
import { AddKeyTypeToOrgKeysMigrator } from "./migrations/5-add-key-type-to-org-keys";
import { RemoveLegacyEtmKeyMigrator } from "./migrations/6-remove-legacy-etm-key";
import { MoveStateVersionMigrator } from "./migrations/7-move-state-version";
import { MinVersionMigrator } from "./migrations/min-version";

export const MIN_VERSION = 4; //
export type MinVersion = typeof MIN_VERSION;

export function builder(): MigrationBuilder<number> {
  return MigrationBuilder.create()
    .with(MinVersionMigrator)
    .with(AddKeyTypeToOrgKeysMigrator, 4, 5)
    .with(RemoveLegacyEtmKeyMigrator, 5, 6)
    .with(MoveStateVersionMigrator, 6, 7);
}

export async function migrate(storageService: AbstractStorageService): Promise<void> {
  const migrationHelper = new MigrationHelper(await currentVersion(storageService), storageService);
  builder().migrate(migrationHelper);
}

async function currentVersion(stateService: AbstractStorageService) {
  let state = await stateService.get<number>("stateVersion");
  if (!state) {
    // Pre v7
    state = (await stateService.get<{ stateVersion: number }>("global")).stateVersion;
  }
  return state ?? 0;
}
