// eslint-disable-next-line import/no-restricted-paths -- Type interface to ensure Guids are used
import { Guid } from "../../types/guid";
import { MigrationHelper } from "../migration-helper";
import { Migrator } from "../migrator";

type ExpectedFolderData = {
  id: Guid;
  name: string;
  revisionDate: string;
};
type ExpectedAccountType = {
  data?: {
    folders?: {
      encrypted?: Record<Guid, ExpectedFolderData>;
    };
  };
};
type NewAccountType = {
  data?: Record<string, unknown>;
};
type NewFolderType = Record<Guid, ExpectedFolderData>;

/** Key used for data persistence. This value should not change without an associated state migration */
const SERVICE_KEY = "folder";
/** Key used for data persistence. This value should not change without an associated state migration */
const FOLDERS_KEY = "folders";

function accountFoldersKey(userId: Guid) {
  return `account.${userId}.${SERVICE_KEY}.${FOLDERS_KEY}`;
}

export class MoveFoldersToRootMigrator extends Migrator<7, 8> {
  async migrate(helper: MigrationHelper): Promise<void> {
    const accounts = await helper.getAccounts<ExpectedAccountType>();

    async function moveFolders(userId: Guid, account: ExpectedAccountType) {
      if (account?.data?.folders?.encrypted != null) {
        await helper.set(accountFoldersKey(userId), account.data.folders.encrypted);
        delete account.data.folders;
        await helper.set(userId, account);
      }
    }

    await Promise.all(accounts.map(({ userId, account }) => moveFolders(userId, account)));
  }

  async rollback(helper: MigrationHelper): Promise<void> {
    const accounts = await helper.getAccounts<NewAccountType>();

    async function revertFoldersMove(userId: Guid, account: NewAccountType) {
      const newFolders = await helper.get<NewFolderType>(accountFoldersKey(userId));
      if (account?.data == null) {
        return;
      }
      const revertedAccount = account as ExpectedAccountType;
      revertedAccount.data.folders ||= { encrypted: {} };
      revertedAccount.data.folders.encrypted = newFolders;

      helper.set(userId, revertedAccount);
      helper.remove(accountFoldersKey(userId));
    }

    await Promise.all(accounts.map(({ userId, account }) => revertFoldersMove(userId, account)));
  }
}
