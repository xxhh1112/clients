import { ConfigServiceAbstraction } from "@bitwarden/common/platform/abstractions/config/config.service.abstraction";
import { ConfigService } from "@bitwarden/common/platform/services/config/config.service";

import {
  authServiceFactory,
  AuthServiceInitOptions,
} from "../../../auth/background/service-factories/auth-service.factory";

import { configApiServiceFactory, ConfigApiServiceInitOptions } from "./config-api.service.factory";
import {
  environmentServiceFactory,
  EnvironmentServiceInitOptions,
} from "./environment-service.factory";
import { FactoryOptions, CachedServices, factory } from "./factory-options";
import { stateServiceFactory, StateServiceInitOptions } from "./state-service.factory";


type ConfigServiceFactoryOptions = FactoryOptions;

export type ConfigServiceInitOptions = ConfigServiceFactoryOptions &
  StateServiceInitOptions &
  ConfigApiServiceInitOptions &
  AuthServiceInitOptions &
  EnvironmentServiceInitOptions;

export function configServiceFactory(
  cache: { configService?: ConfigServiceAbstraction } & CachedServices,
  opts: ConfigServiceInitOptions
): Promise<ConfigServiceAbstraction> {
  return factory(
    cache,
    "configService",
    opts,
    async () =>
      new ConfigService(
        await stateServiceFactory(cache, opts),
        await configApiServiceFactory(cache, opts),
        await authServiceFactory(cache, opts),
        await environmentServiceFactory(cache, opts)
      )
  );
}
