import { ApiService as AbstractApiService } from "@bitwarden/common/abstractions/api.service";
import { ApiService } from "@bitwarden/common/services/api.service";

import {
  tokenApiServiceFactory,
  TokenApiServiceInitOptions,
} from "../../auth/background/service-factories/token-api-service.factory";

import { apiHelperServiceFactory, ApiHelperServiceInitOptions } from "./api-helper-service.factory";
import {
  environmentServiceFactory,
  EnvironmentServiceInitOptions,
} from "./environment-service.factory";
import { CachedServices, factory, FactoryOptions } from "./factory-options";
import {
  PlatformUtilsServiceInitOptions,
  platformUtilsServiceFactory,
} from "./platform-utils-service.factory";

type ApiServiceFactoryOptions = FactoryOptions & {
  apiServiceOptions: {
    customUserAgent?: string;
  };
};

export type ApiServiceInitOptions = ApiServiceFactoryOptions &
  PlatformUtilsServiceInitOptions &
  EnvironmentServiceInitOptions &
  ApiHelperServiceInitOptions &
  TokenApiServiceInitOptions;

export function apiServiceFactory(
  cache: { apiService?: AbstractApiService } & CachedServices,
  opts: ApiServiceInitOptions
): Promise<AbstractApiService> {
  return factory(
    cache,
    "apiService",
    opts,
    async () =>
      new ApiService(
        await platformUtilsServiceFactory(cache, opts),
        await environmentServiceFactory(cache, opts),
        await apiHelperServiceFactory(cache, opts),
        await tokenApiServiceFactory(cache, opts),
        opts.apiServiceOptions.customUserAgent
      )
  );
}
