import { InternalCipherService } from "@bitwarden/common/abstractions/cipher/cipher.service.abstraction";
import { CipherService } from "@bitwarden/common/services/cipher/cipher.service";

import { cryptoServiceFactory, CryptoServiceInitOptions } from "./crypto-service.factory";
import { CachedServices, factory, FactoryOptions } from "./factory-options";
import { i18nServiceFactory, I18nServiceInitOptions } from "./i18n-service.factory";
import { logServiceFactory, LogServiceInitOptions } from "./log-service.factory";
import { SettingsServiceInitOptions, settingsServiceFactory } from "./settings-service.factory";
import {
  stateServiceFactory as stateServiceFactory,
  StateServiceInitOptions,
} from "./state-service.factory";

type CipherServiceFactoryOptions = FactoryOptions;

export type CipherServiceInitOptions = CipherServiceFactoryOptions &
  CryptoServiceInitOptions &
  SettingsServiceInitOptions &
  I18nServiceInitOptions &
  LogServiceInitOptions &
  StateServiceInitOptions;

export function cipherServiceFactory(
  cache: { cipherService?: InternalCipherService } & CachedServices,
  opts: CipherServiceInitOptions
): Promise<InternalCipherService> {
  return factory(
    cache,
    "cipherService",
    opts,
    async () =>
      new CipherService(
        await cryptoServiceFactory(cache, opts),
        await settingsServiceFactory(cache, opts),
        await i18nServiceFactory(cache, opts),
        await logServiceFactory(cache, opts),
        await stateServiceFactory(cache, opts)
      )
  );
}
