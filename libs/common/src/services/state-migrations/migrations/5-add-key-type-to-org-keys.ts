import { MigrationHelper } from "../migration-helper";
import { Migrator } from "../migrator";

type ExpectedAccountType = { keys?: { organizationKeys?: { encrypted: Record<string, string> } } };
type NewAccountType = {
  keys?: {
    organizationKeys?: { encrypted: Record<string, { type: "organization"; key: string }> };
  };
};

export class AddKeyTypeToOrgKeysMigrator extends Migrator<4, 5> {
  async migrate(helper: MigrationHelper): Promise<void> {
    const accounts = await helper.getAccounts();

    async function updateOrgKey(id: string, account: ExpectedAccountType) {
      const encryptedOrgKeys = account?.keys?.organizationKeys?.encrypted;
      if (encryptedOrgKeys == null) {
        return;
      }

      const newOrgKeys: Record<string, { type: "organization"; key: string }> = {};

      Object.entries(encryptedOrgKeys).forEach(([orgId, encKey]) => {
        newOrgKeys[orgId] = {
          type: "organization",
          key: encKey,
        };
      });
      (account as any).keys.organizationKeys.encrypted = newOrgKeys;

      await helper.set(id, account);
    }

    Promise.all(accounts.map(async ({ id, account }) => updateOrgKey(id, account)));
  }

  async rollback(helper: MigrationHelper): Promise<void> {
    const accounts = await helper.getAccounts();

    async function updateOrgKey(id: string, account: NewAccountType) {
      const encryptedOrgKeys = account?.keys?.organizationKeys?.encrypted;
      if (encryptedOrgKeys == null) {
        return;
      }

      const newOrgKeys: Record<string, string> = {};

      Object.entries(encryptedOrgKeys).forEach(([orgId, encKey]) => {
        newOrgKeys[orgId] = encKey.key;
      });
      (account as any).keys.organizationKeys.encrypted = newOrgKeys;

      await helper.set(id, account);
    }

    Promise.all(accounts.map(async ({ id, account }) => updateOrgKey(id, account)));
  }
}
