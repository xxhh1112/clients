import { Constructor } from "type-fest";

import { MigrationHelper } from "./migration-helper";
import { Migrator, VersionMigrator } from "./migrator";

export class MigrationBuilder<TCurrent extends number = 0> {
  constructor(private migrations: Migrator[] = []) {}

  with<TTo extends number>(
    migrator: Constructor<VersionMigrator<TCurrent, TTo>>
  ): MigrationBuilder<TTo> {
    this.migrations.push(new migrator());
    return new MigrationBuilder<TTo>(this.migrations);
  }

  migrate(helper: MigrationHelper): Promise<void> {
    return this.migrations.reduce(
      (promise, migrator) => promise.then(() => migrator.migrate(helper)),
      Promise.resolve()
    );
  }
}
