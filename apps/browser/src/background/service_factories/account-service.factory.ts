import { InternalAccountService as AbstractAccountService } from "@bitwarden/common/abstractions/account/account.service";
import { AccountServiceImplementation as AccountService } from "@bitwarden/common/services/account/account.service";

import { CachedServices, factory, FactoryOptions } from "./factory-options";
import { logServiceFactory, LogServiceInitOptions } from "./log-service.factory";
import { MessagingServiceInitOptions, messagingServiceFactory } from "./messaging-service.factory";

type AccountServiceFactoyOptions = FactoryOptions;

export type AccountServiceInitOptions = AccountServiceFactoyOptions &
  MessagingServiceInitOptions &
  LogServiceInitOptions;

export function accountServiceFactory(
  cache: { accountService?: AbstractAccountService } & CachedServices,
  opts: AccountServiceInitOptions
): Promise<AbstractAccountService> {
  return factory(
    cache,
    "accountService",
    opts,
    async () =>
      new AccountService(
        await messagingServiceFactory(cache, opts),
        await logServiceFactory(cache, opts)
      )
  );
}
