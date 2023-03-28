import { ApiHelperService } from "@bitwarden/common/abstractions/api-helper.service.abstraction";
import { ApiHelperServiceImplementation } from "@bitwarden/common/services/api-helper.service.implementation";

import {
  environmentServiceFactory,
  EnvironmentServiceInitOptions,
} from "./environment-service.factory";
import { FactoryOptions, CachedServices, factory } from "./factory-options";
import {
  platformUtilsServiceFactory,
  PlatformUtilsServiceInitOptions,
} from "./platform-utils-service.factory";

type ApiHelperServiceFactoryOptions = FactoryOptions & {
  apiHelperServiceOptions: {
    logoutCallback: (expired: boolean) => Promise<void>;
    customUserAgent?: string;
  };
};

export type ApiHelperServiceInitOptions = ApiHelperServiceFactoryOptions &
  PlatformUtilsServiceInitOptions &
  EnvironmentServiceInitOptions;

export function apiHelperServiceFactory(
  cache: { apiHelperService?: ApiHelperService } & CachedServices,
  opts: ApiHelperServiceInitOptions
): Promise<ApiHelperService> {
  return factory(
    cache,
    "apiHelperService",
    opts,
    async () =>
      new ApiHelperServiceImplementation(
        await platformUtilsServiceFactory(cache, opts),
        await environmentServiceFactory(cache, opts),
        opts.apiHelperServiceOptions.logoutCallback,
        opts.apiHelperServiceOptions.customUserAgent
      )
  );
}
