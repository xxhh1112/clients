import { MigrationBuilder } from "./migration-builder";
import { MigrationHelper } from "./migration-helper";
import { Migrator1 } from "./migrations/migrator-1";
import { Migrator2 } from "./migrations/migrator-2";

const migratationBuilder = new MigrationBuilder<1>();

export async function migrate(): Promise<void> {
  const migrationHelper = new MigrationHelper(0);
  await migratationBuilder.with(Migrator1).with(Migrator2).migrate(migrationHelper);
}
