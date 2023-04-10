import { KeyConnectorService as AbstractKeyConnectorService } from "@bitwarden/common/auth/abstractions/key-connector.service";
import { KeyConnectorService } from "@bitwarden/common/auth/services/key-connector.service";

import {
  OrganizationServiceInitOptions,
  organizationServiceFactory,
} from "../../../admin-console/background/service-factories/organization-service.factory";
import {
  cryptoFunctionServiceFactory,
  CryptoFunctionServiceInitOptions,
} from "../../../background/service_factories/crypto-function-service.factory";
import {
  CryptoServiceInitOptions,
  cryptoServiceFactory,
} from "../../../background/service_factories/crypto-service.factory";
import {
  FactoryOptions,
  CachedServices,
  factory,
} from "../../../background/service_factories/factory-options";
import {
  logServiceFactory,
  LogServiceInitOptions,
} from "../../../background/service_factories/log-service.factory";
import {
  stateServiceFactory,
  StateServiceInitOptions,
} from "../../../background/service_factories/state-service.factory";

import {
  accountApiServiceFactory,
  AccountApiServiceInitOptions,
} from "./account-api-service.factory";
import {
  KeyConnectorApiServiceInitOptions,
  keyConnectorApiServiceFactory,
} from "./key-connector-api-service.factory";
import { TokenServiceInitOptions, tokenServiceFactory } from "./token-service.factory";

type KeyConnectorServiceFactoryOptions = FactoryOptions & {
  keyConnectorServiceOptions: {
    logoutCallback: (expired: boolean, userId?: string) => Promise<void>;
  };
};

export type KeyConnectorServiceInitOptions = KeyConnectorServiceFactoryOptions &
  StateServiceInitOptions &
  CryptoServiceInitOptions &
  KeyConnectorApiServiceInitOptions &
  TokenServiceInitOptions &
  LogServiceInitOptions &
  OrganizationServiceInitOptions &
  CryptoFunctionServiceInitOptions &
  AccountApiServiceInitOptions;

export function keyConnectorServiceFactory(
  cache: { keyConnectorService?: AbstractKeyConnectorService } & CachedServices,
  opts: KeyConnectorServiceInitOptions
): Promise<AbstractKeyConnectorService> {
  return factory(
    cache,
    "keyConnectorService",
    opts,
    async () =>
      new KeyConnectorService(
        await stateServiceFactory(cache, opts),
        await cryptoServiceFactory(cache, opts),
        await keyConnectorApiServiceFactory(cache, opts),
        await tokenServiceFactory(cache, opts),
        await logServiceFactory(cache, opts),
        await organizationServiceFactory(cache, opts),
        await cryptoFunctionServiceFactory(cache, opts),
        await accountApiServiceFactory(cache, opts),
        opts.keyConnectorServiceOptions.logoutCallback
      )
  );
}
