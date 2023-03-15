import { MigrationHelper } from "./migration-helper";
import { Direction, Migrator, VersionFrom, VersionTo } from "./migrator";

export class MigrationBuilder<TCurrent extends number = 0> {
  static create(): MigrationBuilder<0> {
    return new MigrationBuilder([]);
  }

  private constructor(
    private migrations: { migrator: Migrator<number, number>; direction: Direction }[]
  ) {}

  with<
    TMigrator extends Migrator<number, number>,
    TFrom extends VersionFrom<TMigrator> & TCurrent,
    TTo extends VersionTo<TMigrator>
  >(
    ...migrate: [new () => TMigrator] | [new (from: TFrom, to: TTo) => TMigrator, TFrom, TTo]
  ): MigrationBuilder<TTo> {
    return this.addMigrator(migrate, "up");
  }

  rollback<
    TMigrator extends Migrator<number, number>,
    TFrom extends VersionFrom<TMigrator>,
    TTo extends VersionTo<TMigrator> & TCurrent
  >(
    ...migrate: [new () => TMigrator] | [new (from: TFrom, to: TTo) => TMigrator, TTo, TFrom]
  ): MigrationBuilder<TFrom> {
    if (migrate.length === 3) {
      migrate = [migrate[0], migrate[2], migrate[1]];
    }
    return this.addMigrator(migrate, "down");
  }

  migrate(helper: MigrationHelper): Promise<void> {
    return this.migrations.reduce(
      (promise, migrator) =>
        promise.then(async () => {
          await this.runMigrator(migrator.migrator, helper, migrator.direction);
        }),
      Promise.resolve()
    );
  }

  private addMigrator<
    TMigrator extends Migrator<number, number>,
    TFrom extends VersionFrom<TMigrator> & TCurrent,
    TTo extends VersionTo<TMigrator>
  >(
    migrate: [new () => TMigrator] | [new (from: TFrom, to: TTo) => TMigrator, TFrom, TTo],
    direction: Direction = "up"
  ) {
    if (migrate.length === 1) {
      this.migrations.push({ migrator: new migrate[0](), direction });
    } else {
      this.migrations.push({ migrator: new migrate[0](migrate[1], migrate[2]), direction });
    }

    return new MigrationBuilder<TTo>(this.migrations);
  }

  private async runMigrator(
    migrator: Migrator<number, number>,
    helper: MigrationHelper,
    direction: Direction
  ): Promise<void> {
    if (await migrator.shouldMigrate(helper, direction)) {
      const method = direction === "up" ? migrator.migrate : migrator.rollback;
      await method(helper).then(() => migrator.updateVersion(helper, direction));
    }
  }
}
