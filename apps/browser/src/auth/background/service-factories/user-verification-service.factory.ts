import { UserVerificationService } from "@bitwarden/common/auth/abstractions/userVerification/userVerification.service.abstraction";
import { UserVerificationService as UserVerificationServiceImplementation } from "@bitwarden/common/auth/services/user-verification/user-verification.service";

import {
  cryptoServiceFactory,
  CryptoServiceInitOptions,
} from "../../../background/service_factories/crypto-service.factory";
import {
  CachedServices,
  factory,
  FactoryOptions,
} from "../../../background/service_factories/factory-options";
import {
  i18nServiceFactory,
  I18nServiceInitOptions,
} from "../../../background/service_factories/i18n-service.factory";

import {
  userVerificationApiServiceFactory,
  UserVerificationApiServiceInitOptions,
} from "./user-verification-api-service.factory";

type UserVerificationServiceFactoryOptions = FactoryOptions;

export type UserVerificationServiceInitOptions = UserVerificationServiceFactoryOptions &
  CryptoServiceInitOptions &
  I18nServiceInitOptions &
  UserVerificationApiServiceInitOptions;

export function userVerificationServiceFactory(
  cache: { userVerificationService?: UserVerificationService } & CachedServices,
  opts: UserVerificationServiceInitOptions
): Promise<UserVerificationService> {
  return factory(
    cache,
    "userVerificationService",
    opts,
    async () =>
      new UserVerificationServiceImplementation(
        await cryptoServiceFactory(cache, opts),
        await i18nServiceFactory(cache, opts),
        await userVerificationApiServiceFactory(cache, opts)
      )
  );
}
