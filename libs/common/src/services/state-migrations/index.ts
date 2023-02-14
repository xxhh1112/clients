import { MigrationBuilder } from "./migration-builder";
import { MigrationHelper } from "./migration-helper";
import { MinVersionMigrator } from "./migrations/min-version";

const migratationBuilder = new MigrationBuilder<6>();

export async function migrate(): Promise<void> {
  const migrationHelper = new MigrationHelper(0);
  await migratationBuilder.with(MinVersionMigrator).migrate(migrationHelper);
}
