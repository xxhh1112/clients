import { StateVersion } from "../../../enums/stateVersion";
import { keys } from "../../stateMigration.service";
import { TokenService } from "../../token.service";
import { MigrationHelper } from "../migration-helper";
import { VersionMigrator } from "../migrator";

export class Migrator2 extends VersionMigrator<2, 3> {
  async migrate(helper: MigrationHelper): Promise<void> {
    const authenticatedUserIds = await helper.get<string[]>(keys.authenticatedAccounts);
    await Promise.all(
      authenticatedUserIds.map(async (userId) => {
        const account = await helper.get<{
          profile: { hasPremiumPersonally: boolean };
          tokens: { accessToken: string };
        }>(userId);
        if (
          account?.profile?.hasPremiumPersonally === null &&
          account.tokens?.accessToken != null
        ) {
          const decodedToken = await TokenService.decodeToken(account.tokens.accessToken);
          account.profile.hasPremiumPersonally = decodedToken.premium;
          await helper.set(userId, account);
        }
      })
    );

    const globals = await this.getGlobals();
    globals.stateVersion = StateVersion.Three;
    await helper.set(keys.global, globals);
  }
}
