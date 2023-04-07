import { InternalAccountService as InternalAccountServiceAbstraction } from "@bitwarden/common/auth/abstractions/account.service";
import { AccountServiceImplementation } from "@bitwarden/common/auth/services/account.service";

import {
  CachedServices,
  factory,
  FactoryOptions,
} from "../../../background/service_factories/factory-options";
import {
  logServiceFactory,
  LogServiceInitOptions,
} from "../../../background/service_factories/log-service.factory";
import {
  messagingServiceFactory,
  MessagingServiceInitOptions,
} from "../../../background/service_factories/messaging-service.factory";

type AccountServiceFactoryOptions = FactoryOptions;

export type AccountServiceInitOptions = AccountServiceFactoryOptions &
  MessagingServiceInitOptions &
  LogServiceInitOptions;

export function accountServiceFactory(
  cache: { accountService?: InternalAccountServiceAbstraction } & CachedServices,
  opts: AccountServiceInitOptions
): Promise<InternalAccountServiceAbstraction> {
  return factory(
    cache,
    "accountService",
    opts,
    async () =>
      new AccountServiceImplementation(
        await messagingServiceFactory(cache, opts),
        await logServiceFactory(cache, opts)
      )
  );
}
