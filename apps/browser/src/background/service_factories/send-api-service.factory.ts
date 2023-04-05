import { SendApiService } from "@bitwarden/common/tools/send/services/send-api.service";
import { SendApiService as AbstractSendApiService } from "@bitwarden/common/tools/send/services/send-api.service.abstraction";

import { ApiServiceInitOptions, apiServiceFactory } from "./api-service.factory";
import { CachedServices, FactoryOptions, factory } from "./factory-options";
import {
  FileUploadServiceInitOptions,
  fileUploadServiceFactory,
} from "./file-upload-service.factory";
import { SendServiceInitOptions, sendServiceFactory } from "./send-service.factory";

type SendApiServiceOptions = FactoryOptions;

export type SendApiServiceInitOptions = SendApiServiceOptions &
  ApiServiceInitOptions &
  FileUploadServiceInitOptions &
  SendServiceInitOptions;

export function sendApiServiceFactory(
  cache: { sendApiService?: AbstractSendApiService } & CachedServices,
  opts: SendApiServiceInitOptions
): Promise<AbstractSendApiService> {
  return factory(
    cache,
    "sendApiService",
    opts,
    async () =>
      new SendApiService(
        await apiServiceFactory(cache, opts),
        await fileUploadServiceFactory(cache, opts),
        await sendServiceFactory(cache, opts)
      )
  );
}
