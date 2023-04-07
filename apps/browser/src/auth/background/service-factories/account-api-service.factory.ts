import { AccountApiService as AccountApiServiceAbstraction } from "@bitwarden/common/auth/abstractions/account-api.service";
import { AccountApiServiceImplementation } from "@bitwarden/common/auth/services/account-api.service";

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
import {
  logServiceFactory,
  LogServiceInitOptions,
} from "../../../background/service_factories/log-service.factory";

import { accountServiceFactory, AccountServiceInitOptions } from "./account-service.factory";
import {
  userVerificationServiceFactory,
  UserVerificationServiceInitOptions,
} from "./user-verification-service.factory";

type AccountApiServiceFactoryOptions = FactoryOptions;

export type AccountApiServiceInitOptions = AccountApiServiceFactoryOptions &
  ApiServiceInitOptions &
  UserVerificationServiceInitOptions &
  LogServiceInitOptions &
  AccountServiceInitOptions &
  EnvironmentServiceInitOptions;

export function accountApiServiceFactory(
  cache: { accountApiService?: AccountApiServiceAbstraction } & CachedServices,
  opts: AccountApiServiceInitOptions
): Promise<AccountApiServiceAbstraction> {
  return factory(
    cache,
    "accountApiService",
    opts,
    async () =>
      new AccountApiServiceImplementation(
        await apiServiceFactory(cache, opts),
        await userVerificationServiceFactory(cache, opts),
        await logServiceFactory(cache, opts),
        await accountServiceFactory(cache, opts),
        await environmentServiceFactory(cache, opts)
      )
  );
}
