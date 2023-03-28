import { TokenApiService } from "@bitwarden/common/auth/abstractions/token-api.service.abstraction";
import { TokenApiServiceImplementation } from "@bitwarden/common/auth/services/token-api.service.implementation";

import {
  apiHelperServiceFactory,
  ApiHelperServiceInitOptions,
} from "../../../background/service_factories/api-helper-service.factory";
import {
  appIdServiceFactory,
  AppIdServiceInitOptions,
} from "../../../background/service_factories/app-id-service.factory";
import {
  EnvironmentServiceInitOptions,
  environmentServiceFactory,
} from "../../../background/service_factories/environment-service.factory";
import {
  FactoryOptions,
  CachedServices,
  factory,
} from "../../../background/service_factories/factory-options";
import {
  PlatformUtilsServiceInitOptions,
  platformUtilsServiceFactory,
} from "../../../background/service_factories/platform-utils-service.factory";

import { tokenServiceFactory, TokenServiceInitOptions } from "./token-service.factory";

type TokenApiServiceFactoryOptions = FactoryOptions;

export type TokenApiServiceInitOptions = TokenApiServiceFactoryOptions &
  PlatformUtilsServiceInitOptions &
  EnvironmentServiceInitOptions &
  TokenServiceInitOptions &
  AppIdServiceInitOptions &
  ApiHelperServiceInitOptions;

export function tokenApiServiceFactory(
  cache: { tokenApiService?: TokenApiService } & CachedServices,
  opts: TokenApiServiceInitOptions
): Promise<TokenApiService> {
  return factory(
    cache,
    "tokenApiService",
    opts,
    async () =>
      new TokenApiServiceImplementation(
        await platformUtilsServiceFactory(cache, opts),
        await environmentServiceFactory(cache, opts),
        await tokenServiceFactory(cache, opts),
        await appIdServiceFactory(cache, opts),
        await apiHelperServiceFactory(cache, opts)
      )
  );
}
