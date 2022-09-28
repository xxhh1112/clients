import { FileUploadService as AbstractFileUploadService } from "@bitwarden/common/abstractions/fileUpload.service";
import { FileUploadService } from "@bitwarden/common/services/fileUpload.service";

import { apiServiceFactory, ApiServiceInitOptions } from "./api-service.factory";
import { cipherServiceFactory, CipherServiceInitOptions } from "./cipher-service.factory";
import { cryptoServiceFactory, CryptoServiceInitOptions } from "./crypto-service.factory";
import { FactoryOptions, CachedServices, factory } from "./factory-options";
import { logServiceFactory, LogServiceInitOptions } from "./log-service.factory";
import {
  cipherAttachmentApiServiceFactory,
  CipherAttachmentApiServiceInitOptions,
} from "./cipher-attachment-api.service.factory";

type FileUploadServiceFactoyOptions = FactoryOptions;

export type FileUploadServiceInitOptions = FileUploadServiceFactoyOptions &
  LogServiceInitOptions &
  ApiServiceInitOptions &
  CipherAttachmentApiServiceInitOptions &
  CipherServiceInitOptions &
  CryptoServiceInitOptions;

export function fileUploadServiceFactory(
  cache: { fileUploadService?: AbstractFileUploadService } & CachedServices,
  opts: FileUploadServiceInitOptions
): Promise<AbstractFileUploadService> {
  return factory(
    cache,
    "fileUploadService",
    opts,
    async () =>
      new FileUploadService(
        await logServiceFactory(cache, opts),
        await apiServiceFactory(cache, opts),
        await cipherAttachmentApiServiceFactory(cache, opts),
        await cipherServiceFactory(cache, opts),
        await cryptoServiceFactory(cache, opts)
      )
  );
}
