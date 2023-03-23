// eslint-disable-next-line import/no-restricted-paths -- Used for token decoding, which are valid for days. We want the latest
import { TokenService } from "../../auth/services/token.service";
import { MigrationHelper } from "../migration-helper";
import { Migrator, IRREVERSIBLE, Direction } from "../migrator";

type ExpectedAccountType = {
  profile?: { hasPremiumPersonally?: boolean };
  tokens?: { accessToken?: string };
};

export class FixPremiumMigrator extends Migrator<2, 3> {
  async migrate(helper: MigrationHelper): Promise<void> {
    const accounts = await helper.getAccounts<ExpectedAccountType>();

    async function fixPremium(id: string, account: ExpectedAccountType) {
      if (account?.profile?.hasPremiumPersonally === null && account.tokens?.accessToken != null) {
        let decodedToken: { premium: boolean };
        try {
          decodedToken = await TokenService.decodeToken(account.tokens.accessToken);
        } catch {
          return;
        }

        if (decodedToken?.premium == null) {
          return;
        }

        account.profile.hasPremiumPersonally = decodedToken?.premium;
        return helper.set(id, account);
      }
    }

    await Promise.all(accounts.map(async ({ id, account }) => fixPremium(id, account)));
  }

  rollback(helper: MigrationHelper): Promise<void> {
    throw IRREVERSIBLE;
  }

  // Override is necessary because default implementation assumes `stateVersion` at the root, but for this version
  // it is nested inside a global object.
  override async updateVersion(helper: MigrationHelper, direction: Direction): Promise<void> {
    const endVersion = direction === "up" ? this.toVersion : this.fromVersion;
    helper.currentVersion = endVersion;
    const global: { stateVersion: number } = (await helper.get("global")) || ({} as any);
    await helper.set("global", { ...global, stateVersion: endVersion });
  }
}
