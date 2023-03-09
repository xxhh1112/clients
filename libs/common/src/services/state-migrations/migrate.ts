import { AbstractStorageService } from "../../abstractions/storage.service";

import { MigrationBuilder } from "./migration-builder";
import { MigrationHelper } from "./migration-helper";
import { MoveStateVersionMigrator } from "./migrations/7-move-state-version";
import { MinVersionMigrator } from "./migrations/min-version";

export const MIN_VERSION = 6;
export type MinVersion = typeof MIN_VERSION;

export function builder(): MigrationBuilder<number> {
  return MigrationBuilder.create().with(MinVersionMigrator).with(MoveStateVersionMigrator, 6, 7);
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
