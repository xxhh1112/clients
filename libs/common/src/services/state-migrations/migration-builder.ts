import { Constructor } from "type-fest";

import { MigrationHelper } from "./migration-helper";
import { Migrator } from "./migrator";

export class MigrationBuilder<TCurrent extends number = 0> {
  constructor(private migrations: Migrator<any, any>[] = []) {}

  with<TTo extends number>(migrator: Constructor<Migrator<TCurrent, TTo>>): MigrationBuilder<TTo> {
    const migratorInstance = new migrator();

    if (migratorInstance.fromVersion == null || migratorInstance.toVersion == null) {
      throw new Error("Migrator must instantiate fromVersion and toVersion properties");
    }

    this.migrations.push(new migrator());
    return new MigrationBuilder<TTo>(this.migrations);
  }

  migrate(helper: MigrationHelper): Promise<void> {
    return this.migrations.reduce(
      (promise, migrator) =>
        promise.then(async () => {
          if (helper.currentVersion === migrator.fromVersion) {
            await migrator.migrate(helper);
            await migrator.updateVersion(helper);
          }
        }),
      Promise.resolve()
    );
  }
}
