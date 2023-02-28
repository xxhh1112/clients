import { SyncService as AbstractSyncService } from "@bitwarden/common/abstractions/sync/sync.service.abstraction";
import { SyncService } from "@bitwarden/common/services/sync/sync.service";

import { apiServiceFactory, ApiServiceInitOptions } from "./api-service.factory";
import { cipherServiceFactory, CipherServiceInitOptions } from "./cipher-service.factory";
import {
  collectionServiceFactory,
  CollectionServiceInitOptions,
} from "./collection-service.factory";
import { cryptoServiceFactory, CryptoServiceInitOptions } from "./crypto-service.factory";
import { CachedServices, factory, FactoryOptions } from "./factory-options";
import { folderApiServiceFactory, FolderApiServiceInitOptions } from "./folder-api-service.factory";
import { folderServiceFactory, FolderServiceInitOptions } from "./folder-service.factory";
import {
  keyConnectorServiceFactory,
  KeyConnectorServiceInitOptions,
} from "./key-connector-service.factory";
import { logServiceFactory, LogServiceInitOptions } from "./log-service.factory";
import { messagingServiceFactory, MessagingServiceInitOptions } from "./messaging-service.factory";
import {
  organizationServiceFactory,
  OrganizationServiceInitOptions,
} from "./organization-service.factory";
import { policyServiceFactory, PolicyServiceInitOptions } from "./policy-service.factory";
import { providerServiceFactory, ProviderServiceInitOptions } from "./provider-service.factory";
import { sendServiceFactory, SendServiceInitOptions } from "./send-service.factory";
import { settingsServiceFactory, SettingsServiceInitOptions } from "./settings-service.factory";
import { stateServiceFactory, StateServiceInitOptions } from "./state-service.factory";

type SyncServiceFactoryOptions = FactoryOptions & {
  syncServiceOptions: {
    logoutCallback: (expired: boolean) => Promise<void>;
  };
};

export type SyncServiceInitOptions = SyncServiceFactoryOptions &
  ApiServiceInitOptions &
  SettingsServiceInitOptions &
  FolderServiceInitOptions &
  CipherServiceInitOptions &
  CryptoServiceInitOptions &
  CollectionServiceInitOptions &
  MessagingServiceInitOptions &
  PolicyServiceInitOptions &
  SendServiceInitOptions &
  LogServiceInitOptions &
  KeyConnectorServiceInitOptions &
  StateServiceInitOptions &
  ProviderServiceInitOptions &
  FolderApiServiceInitOptions &
  OrganizationServiceInitOptions;

export function syncServiceFactory(
  cache: { syncService?: AbstractSyncService } & CachedServices,
  opts: SyncServiceInitOptions
): Promise<AbstractSyncService> {
  return factory(
    cache,
    "syncService",
    opts,
    async () =>
      new SyncService(
        await apiServiceFactory(cache, opts),
        await settingsServiceFactory(cache, opts),
        await folderServiceFactory(cache, opts),
        await cipherServiceFactory(cache, opts),
        await cryptoServiceFactory(cache, opts),
        await collectionServiceFactory(cache, opts),
        await messagingServiceFactory(cache, opts),
        await policyServiceFactory(cache, opts),
        await sendServiceFactory(cache, opts),
        await logServiceFactory(cache, opts),
        await keyConnectorServiceFactory(cache, opts),
        await stateServiceFactory(cache, opts),
        await providerServiceFactory(cache, opts),
        await folderApiServiceFactory(cache, opts),
        await organizationServiceFactory(cache, opts),
        opts.syncServiceOptions.logoutCallback
      )
  );
}
