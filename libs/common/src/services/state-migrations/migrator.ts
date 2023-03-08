import { MigrationHelper } from "./migration-helper";

export const IRREVERSIBLE = new Error("Irreversible migration");

export abstract class Migrator<TFrom extends number, TTo extends number> {
  abstract fromVersion: TFrom;
  abstract toVersion: TTo;

  abstract migrate(helper: MigrationHelper): Promise<void>;
  abstract rollback(helper: MigrationHelper): Promise<void>;
}
