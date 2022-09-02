import { CipherApiAttachmentServiceAbstraction } from "@bitwarden/common/abstractions/cipher/cipher-api-attachment.service.abstraction";
import { CipherApiAttachmentService } from "@bitwarden/common/services/cipher/cipher-api-attachment.service";

import { apiServiceFactory, ApiServiceInitOptions } from "./api-service.factory";
import { cipherServiceFactory, CipherServiceInitOptions } from "./cipher-service.factory";
import { cryptoServiceFactory, CryptoServiceInitOptions } from "./crypto-service.factory";
import { CachedServices, factory, FactoryOptions } from "./factory-options";
import {
  fileUploadServiceFactory,
  FileUploadServiceInitOptions,
} from "./file-upload-service.factory";

type CipherAttachmentServiceFactoryOptions = FactoryOptions;

export type CipherAttachmentServiceInitOptions = CipherAttachmentServiceFactoryOptions &
  CipherServiceInitOptions &
  ApiServiceInitOptions &
  CryptoServiceInitOptions &
  FileUploadServiceInitOptions;

export function cipherApiAttachmentServiceFactory(
  cache: { cipherApiAttachmentService?: CipherApiAttachmentServiceAbstraction } & CachedServices,
  opts: CipherAttachmentServiceInitOptions
): Promise<CipherApiAttachmentServiceAbstraction> {
  return factory(
    cache,
    "cipherApiAttachmentService",
    opts,
    async () =>
      new CipherApiAttachmentService(
        await cipherServiceFactory(cache, opts),
        await apiServiceFactory(cache, opts),
        await cryptoServiceFactory(cache, opts),
        await fileUploadServiceFactory(cache, opts)
      )
  );
}
