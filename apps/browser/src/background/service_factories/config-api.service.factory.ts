import { ConfigApiServiceAbstraction } from "@bitwarden/common/abstractions/config/config-api.service.abstraction";
import { ConfigApiService } from "@bitwarden/common/services/config/config-api.service";

import { apiServiceFactory, ApiServiceInitOptions } from "./api-service.factory";
import { FactoryOptions, CachedServices, factory } from "./factory-options";

type ConfigApiServiceFactoyOptions = FactoryOptions;

export type ConfigApiServiceInitOptions = ConfigApiServiceFactoyOptions & ApiServiceInitOptions;

export function configApiServiceFactory(
  cache: { configApiService?: ConfigApiServiceAbstraction } & CachedServices,
  opts: ConfigApiServiceInitOptions
): Promise<ConfigApiServiceAbstraction> {
  return factory(
    cache,
    "configApiService",
    opts,
    async () => new ConfigApiService(await apiServiceFactory(cache, opts))
  );
}
