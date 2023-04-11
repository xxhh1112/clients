import { AuthRequestApiService as AuthRequestApiServiceAbstraction } from "@bitwarden/common/auth/abstractions/auth-request-api.service.abstraction";
import { AuthRequestApiServiceImplementation } from "@bitwarden/common/auth/services/auth-request-api.service.implementation";

import {
  apiServiceFactory,
  ApiServiceInitOptions,
} from "../../../background/service_factories/api-service.factory";
import {
  CachedServices,
  factory,
  FactoryOptions,
} from "../../../background/service_factories/factory-options";

type AuthRequestApiServiceFactoryOptions = FactoryOptions;

export type AuthRequestApiServiceInitOptions = AuthRequestApiServiceFactoryOptions &
  ApiServiceInitOptions;

export function authRequestApiServiceFactory(
  cache: { authRequestApiService?: AuthRequestApiServiceAbstraction } & CachedServices,
  opts: AuthRequestApiServiceInitOptions
): Promise<AuthRequestApiServiceAbstraction> {
  return factory(
    cache,
    "authRequestApiService",
    opts,
    async () => new AuthRequestApiServiceImplementation(await apiServiceFactory(cache, opts))
  );
}
