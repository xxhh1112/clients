import { SystemService as AbstractSystemService } from "@bitwarden/common/abstractions/system.service";
import { SystemService } from "@bitwarden/common/services/system.service";

import { FactoryOptions, CachedServices, factory } from "./factory-options";
import { messagingServiceFactory, MessagingServiceInitOptions } from "./messaging-service.factory";
import {
  platformUtilsServiceFactory,
  PlatformUtilsServiceInitOptions,
} from "./platform-utils-service.factory";
import { stateServiceFactory, StateServiceInitOptions } from "./state-service.factory";

type SystemServiceFactoryOptions = FactoryOptions & {
  systemServiceOptions: {
    reloadCallback: () => Promise<void>;
  };
};

export type SystemServiceInitOptions = SystemServiceFactoryOptions &
  MessagingServiceInitOptions &
  PlatformUtilsServiceInitOptions &
  StateServiceInitOptions;

export function systemServiceFactory(
  cache: { systemService?: AbstractSystemService } & CachedServices,
  opts: SystemServiceInitOptions
): Promise<AbstractSystemService> {
  return factory(
    cache,
    "systemService",
    opts,
    async () =>
      new SystemService(
        await messagingServiceFactory(cache, opts),
        await platformUtilsServiceFactory(cache, opts),
        opts.systemServiceOptions.reloadCallback,
        await stateServiceFactory(cache, opts)
      )
  );
}
