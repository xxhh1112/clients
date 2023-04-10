import { UserVerificationApiServiceAbstraction } from "@bitwarden/common/auth/abstractions/userVerification/user-verification-api.service.abstraction";
import { UserVerificationApiService as UserVerificationApiServiceImplementation } from "@bitwarden/common/auth/services/user-verification/user-verification-api.service";

import {
  apiServiceFactory,
  ApiServiceInitOptions,
} from "../../../background/service_factories/api-service.factory";
import {
  CachedServices,
  factory,
  FactoryOptions,
} from "../../../background/service_factories/factory-options";

type UserVerificationApiServiceFactoryOptions = FactoryOptions;

export type UserVerificationApiServiceInitOptions = UserVerificationApiServiceFactoryOptions &
  ApiServiceInitOptions;

export function userVerificationApiServiceFactory(
  cache: { userVerificationApiService?: UserVerificationApiServiceAbstraction } & CachedServices,
  opts: UserVerificationApiServiceInitOptions
): Promise<UserVerificationApiServiceAbstraction> {
  return factory(
    cache,
    "userVerificationApiService",
    opts,
    async () => new UserVerificationApiServiceImplementation(await apiServiceFactory(cache, opts))
  );
}
