import { KeyConnectorApiService as KeyConnectorApiServiceAbstraction } from "@bitwarden/common/auth/abstractions/key-connector-api.service.abstraction";
import { KeyConnectorApiServiceImplementation } from "@bitwarden/common/auth/services/key-connector-api.service.implementation";

import {
  apiHelperServiceFactory,
  ApiHelperServiceInitOptions,
} from "../../../background/service_factories/api-helper-service.factory";
import {
  CachedServices,
  factory,
  FactoryOptions,
} from "../../../background/service_factories/factory-options";

import { tokenApiServiceFactory, TokenApiServiceInitOptions } from "./token-api-service.factory";

type KeyConnectorApiServiceFactoryOptions = FactoryOptions;

export type KeyConnectorApiServiceInitOptions = KeyConnectorApiServiceFactoryOptions &
  ApiHelperServiceInitOptions &
  TokenApiServiceInitOptions;

export function keyConnectorApiServiceFactory(
  cache: { keyConnectorApiService?: KeyConnectorApiServiceAbstraction } & CachedServices,
  opts: KeyConnectorApiServiceInitOptions
): Promise<KeyConnectorApiServiceAbstraction> {
  return factory(
    cache,
    "keyConnectorApiService",
    opts,
    async () =>
      new KeyConnectorApiServiceImplementation(
        await apiHelperServiceFactory(cache, opts),
        await tokenApiServiceFactory(cache, opts)
      )
  );
}
