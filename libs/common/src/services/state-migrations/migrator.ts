import { MigrationHelper } from "./migration-helper";

export interface Migrator {
  migrate(helper: MigrationHelper): Promise<void>;
}

export abstract class VersionMigrator<TFrom extends number, TTo extends number>
  implements Migrator
{
  fromVersion: TFrom;
  toVersion: TTo;

  abstract migrate(helper: MigrationHelper): Promise<void>;
}
