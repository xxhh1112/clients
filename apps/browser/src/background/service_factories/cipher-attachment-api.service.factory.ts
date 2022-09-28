import { CipherAttachmentApiServiceAbstraction as AbstractCipherAttachmentApiService } from "@bitwarden/common/abstractions/cipher/cipher-attachment-api.service.abstraction";
import { CipherAttachmentApiService } from "@bitwarden/common/services/cipher/cipher-attachment-api.service";

import { apiServiceFactory, ApiServiceInitOptions } from "./api-service.factory";
import { cipherServiceFactory, CipherServiceInitOptions } from "./cipher-service.factory";
import { cryptoServiceFactory, CryptoServiceInitOptions } from "./crypto-service.factory";
import { CachedServices, factory, FactoryOptions } from "./factory-options";
import { logServiceFactory, LogServiceInitOptions } from "./log-service.factory";

type CipherAttachmentApiServiceFactoryOptions = FactoryOptions;

export type CipherAttachmentApiServiceInitOptions = CipherAttachmentApiServiceFactoryOptions &
  CipherServiceInitOptions &
  ApiServiceInitOptions &
  CryptoServiceInitOptions &
  LogServiceInitOptions;

export function cipherAttachmentApiServiceFactory(
  cache: { cipherAttachmentApiService?: AbstractCipherAttachmentApiService } & CachedServices,
  opts: CipherAttachmentApiServiceInitOptions
): Promise<AbstractCipherAttachmentApiService> {
  return factory(
    cache,
    "cipherAttachmentApiService",
    opts,
    async () =>
      new CipherAttachmentApiService(
        await cipherServiceFactory(cache, opts),
        await apiServiceFactory(cache, opts),
        await cryptoServiceFactory(cache, opts),
        await logServiceFactory(cache, opts)
      )
  );
}
