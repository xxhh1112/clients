import { ProviderService as AbstractProviderService } from "@bitwarden/common/abstractions/provider.service";
import { ProviderService } from "@bitwarden/common/services/provider.service";

import { CachedServices, factory, FactoryOptions } from "./factory-options";
import { stateServiceFactory, StateServiceInitOptions } from "./state-service.factory";

type ProviderServiceFactoryOptions = FactoryOptions;

export type ProviderServiceInitOptions = ProviderServiceFactoryOptions & StateServiceInitOptions;

export function providerServiceFactory(
  cache: { providerService?: AbstractProviderService } & CachedServices,
  opts: ProviderServiceInitOptions
): Promise<AbstractProviderService> {
  return factory(
    cache,
    "providerService",
    opts,
    async () => new ProviderService(await stateServiceFactory(cache, opts))
  );
}
