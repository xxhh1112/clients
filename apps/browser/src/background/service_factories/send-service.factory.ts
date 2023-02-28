import { SendService as AbstractSendService } from "@bitwarden/common/abstractions/send.service";
import { SendService } from "@bitwarden/common/services/send.service";

import { apiServiceFactory, ApiServiceInitOptions } from "./api-service.factory";
import {
  cryptoFunctionServiceFactory,
  CryptoFunctionServiceInitOptions,
} from "./crypto-function-service.factory";
import { cryptoServiceFactory, CryptoServiceInitOptions } from "./crypto-service.factory";
import { CachedServices, factory, FactoryOptions } from "./factory-options";
import {
  fileUploadServiceFactory,
  FileUploadServiceInitOptions,
} from "./file-upload-service.factory";
import { i18nServiceFactory, I18nServiceInitOptions } from "./i18n-service.factory";
import { stateServiceFactory, StateServiceInitOptions } from "./state-service.factory";

type SendServiceFactoryOptions = FactoryOptions;

export type SendServiceInitOptions = SendServiceFactoryOptions &
  CryptoServiceInitOptions &
  ApiServiceInitOptions &
  FileUploadServiceInitOptions &
  I18nServiceInitOptions &
  CryptoFunctionServiceInitOptions &
  StateServiceInitOptions;

export function sendServiceFactory(
  cache: { sendService?: AbstractSendService } & CachedServices,
  opts: SendServiceInitOptions
): Promise<AbstractSendService> {
  return factory(
    cache,
    "sendService",
    opts,
    async () =>
      new SendService(
        await cryptoServiceFactory(cache, opts),
        await apiServiceFactory(cache, opts),
        await fileUploadServiceFactory(cache, opts),
        await i18nServiceFactory(cache, opts),
        await cryptoFunctionServiceFactory(cache, opts),
        await stateServiceFactory(cache, opts)
      )
  );
}
