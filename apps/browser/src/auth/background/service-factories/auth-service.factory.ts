import { AuthService as AbstractAuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { AuthService } from "@bitwarden/common/auth/services/auth.service";

import { appIdServiceFactory } from "../../../background/service_factories/app-id-service.factory";
import {
  cryptoServiceFactory,
  CryptoServiceInitOptions,
} from "../../../background/service_factories/crypto-service.factory";
import {
  EncryptServiceInitOptions,
  encryptServiceFactory,
} from "../../../background/service_factories/encrypt-service.factory";
import {
  environmentServiceFactory,
  EnvironmentServiceInitOptions,
} from "../../../background/service_factories/environment-service.factory";
import {
  CachedServices,
  factory,
  FactoryOptions,
} from "../../../background/service_factories/factory-options";
import {
  I18nServiceInitOptions,
  i18nServiceFactory,
} from "../../../background/service_factories/i18n-service.factory";
import {
  logServiceFactory,
  LogServiceInitOptions,
} from "../../../background/service_factories/log-service.factory";
import {
  MessagingServiceInitOptions,
  messagingServiceFactory,
} from "../../../background/service_factories/messaging-service.factory";
import {
  PlatformUtilsServiceInitOptions,
  platformUtilsServiceFactory,
} from "../../../background/service_factories/platform-utils-service.factory";
import {
  stateServiceFactory,
  StateServiceInitOptions,
} from "../../../background/service_factories/state-service.factory";

import {
  accountApiServiceFactory,
  AccountApiServiceInitOptions,
} from "./account-api-service.factory";
import {
  authRequestApiServiceFactory,
  AuthRequestApiServiceInitOptions,
} from "./auth-request-api-service.factory";
import {
  KeyConnectorServiceInitOptions,
  keyConnectorServiceFactory,
} from "./key-connector-service.factory";
import { tokenApiServiceFactory, TokenApiServiceInitOptions } from "./token-api-service.factory";
import { TokenServiceInitOptions, tokenServiceFactory } from "./token-service.factory";
import { TwoFactorServiceInitOptions, twoFactorServiceFactory } from "./two-factor-service.factory";

type AuthServiceFactoryOptions = FactoryOptions;

export type AuthServiceInitOptions = AuthServiceFactoryOptions &
  CryptoServiceInitOptions &
  AuthRequestApiServiceInitOptions &
  TokenServiceInitOptions &
  PlatformUtilsServiceInitOptions &
  MessagingServiceInitOptions &
  LogServiceInitOptions &
  KeyConnectorServiceInitOptions &
  EnvironmentServiceInitOptions &
  StateServiceInitOptions &
  TwoFactorServiceInitOptions &
  I18nServiceInitOptions &
  EncryptServiceInitOptions &
  TokenApiServiceInitOptions &
  AccountApiServiceInitOptions;

export function authServiceFactory(
  cache: { authService?: AbstractAuthService } & CachedServices,
  opts: AuthServiceInitOptions
): Promise<AbstractAuthService> {
  return factory(
    cache,
    "authService",
    opts,
    async () =>
      new AuthService(
        await cryptoServiceFactory(cache, opts),
        await authRequestApiServiceFactory(cache, opts),
        await tokenServiceFactory(cache, opts),
        await appIdServiceFactory(cache, opts),
        await platformUtilsServiceFactory(cache, opts),
        await messagingServiceFactory(cache, opts),
        await logServiceFactory(cache, opts),
        await keyConnectorServiceFactory(cache, opts),
        await environmentServiceFactory(cache, opts),
        await stateServiceFactory(cache, opts),
        await twoFactorServiceFactory(cache, opts),
        await i18nServiceFactory(cache, opts),
        await encryptServiceFactory(cache, opts),
        await tokenApiServiceFactory(cache, opts),
        await accountApiServiceFactory(cache, opts)
      )
  );
}
