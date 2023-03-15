import { MigrationHelper } from "../migration-helper";
import { Direction, IRREVERSIBLE, Migrator } from "../migrator";

type ExpectedAccountType = { profile?: { everBeenUnlocked?: boolean } };

export class RemoveEverBeenUnlockedMigrator extends Migrator<3, 4> {
  async migrate(helper: MigrationHelper): Promise<void> {
    const accounts = await helper.getAccounts<ExpectedAccountType>();

    async function removeEverBeenUnlocked(id: string, account: ExpectedAccountType) {
      if (account?.profile?.everBeenUnlocked != null) {
        delete account.profile.everBeenUnlocked;
        return helper.set(id, account);
      }
    }

    Promise.all(accounts.map(async ({ id, account }) => removeEverBeenUnlocked(id, account)));
  }

  rollback(helper: MigrationHelper): Promise<void> {
    throw IRREVERSIBLE;
  }

  async updateVersion(helper: MigrationHelper, direction: Direction): Promise<void> {
    const endVersion = direction === "up" ? this.toVersion : this.fromVersion;
    helper.currentVersion = endVersion;
    const global: { stateVersion: number } = (await helper.get("global")) || ({} as any);
    await helper.set("global", { ...global, stateVersion: endVersion });
  }
}
