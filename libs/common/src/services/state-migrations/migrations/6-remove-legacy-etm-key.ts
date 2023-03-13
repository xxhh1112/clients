import { MigrationHelper } from "../migration-helper";
import { IRREVERSIBLE, Migrator } from "../migrator";

type ExpectedAccountType = { keys?: { legacyEtmKey?: string } };

export class RemoveLegacyEtmKeyMigrator extends Migrator<5, 6> {
  async migrate(helper: MigrationHelper): Promise<void> {
    const accounts = await helper.getAccounts<ExpectedAccountType>();

    async function updateAccount(id: string, account: ExpectedAccountType) {
      if (account?.keys?.legacyEtmKey) {
        delete account.keys.legacyEtmKey;
        await helper.set(id, account);
      }
    }

    await Promise.all(accounts.map(({ id, account }) => updateAccount(id, account)));
  }

  async rollback(helper: MigrationHelper): Promise<void> {
    throw IRREVERSIBLE;
  }
}
