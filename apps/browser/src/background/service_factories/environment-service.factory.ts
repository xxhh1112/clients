import { BrowserEnvironmentService } from "../../services/browser-environment.service";

import { accountServiceFactory, AccountServiceInitOptions } from "./account-service.factory";
import { CachedServices, factory, FactoryOptions } from "./factory-options";
import { logServiceFactory, LogServiceInitOptions } from "./log-service.factory";
import {
  stateServiceFactory as stateServiceFactory,
  StateServiceInitOptions,
} from "./state-service.factory";

type EnvironmentServiceFactoryOptions = FactoryOptions;

export type EnvironmentServiceInitOptions = EnvironmentServiceFactoryOptions &
  StateServiceInitOptions &
  AccountServiceInitOptions &
  LogServiceInitOptions;

export function environmentServiceFactory(
  cache: { environmentService?: BrowserEnvironmentService } & CachedServices,
  opts: EnvironmentServiceInitOptions
): Promise<BrowserEnvironmentService> {
  return factory(
    cache,
    "environmentService",
    opts,
    async () =>
      new BrowserEnvironmentService(
        await stateServiceFactory(cache, opts),
        await accountServiceFactory(cache, opts),
        await logServiceFactory(cache, opts)
      )
  );
}
