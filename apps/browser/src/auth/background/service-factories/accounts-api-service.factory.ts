import { AccountsApiService as AccountsApiServiceAbstraction } from "@bitwarden/common/auth/abstractions/accounts-api.service.abstraction";
import { AccountsApiServiceImplementation } from "@bitwarden/common/auth/services/accounts-api.service.implementation";

import {
  apiServiceFactory,
  ApiServiceInitOptions,
} from "../../../background/service_factories/api-service.factory";
import {
  environmentServiceFactory,
  EnvironmentServiceInitOptions,
} from "../../../background/service_factories/environment-service.factory";
import {
  FactoryOptions,
  CachedServices,
  factory,
} from "../../../background/service_factories/factory-options";

type AccountsApiServiceFactoryOptions = FactoryOptions;

export type AccountsApiServiceInitOptions = AccountsApiServiceFactoryOptions &
  EnvironmentServiceInitOptions &
  ApiServiceInitOptions;

export function accountsApiServiceFactory(
  cache: { accountsApiService?: AccountsApiServiceAbstraction } & CachedServices,
  opts: AccountsApiServiceInitOptions
): Promise<AccountsApiServiceAbstraction> {
  return factory(
    cache,
    "accountsApiService",
    opts,
    async () =>
      new AccountsApiServiceImplementation(
        await environmentServiceFactory(cache, opts),
        await apiServiceFactory(cache, opts)
      )
  );
}
