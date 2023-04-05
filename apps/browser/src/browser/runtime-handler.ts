import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { EventUploadService } from "@bitwarden/common/abstractions/event/event-upload.service";
import { MessagingService } from "@bitwarden/common/abstractions/messaging.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { SearchService } from "@bitwarden/common/abstractions/search.service";
import { SettingsService } from "@bitwarden/common/abstractions/settings.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { AbstractStorageService } from "@bitwarden/common/abstractions/storage.service";
import { SystemService } from "@bitwarden/common/abstractions/system.service";
import { VaultTimeoutSettingsService } from "@bitwarden/common/abstractions/vaultTimeout/vaultTimeoutSettings.service";
import { CollectionService } from "@bitwarden/common/admin-console/abstractions/collection.service";
import { PolicyService } from "@bitwarden/common/admin-console/services/policy/policy.service";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { KeyConnectorService } from "@bitwarden/common/auth/abstractions/key-connector.service";
import { StateFactory } from "@bitwarden/common/factories/stateFactory";
import { GlobalState } from "@bitwarden/common/models/domain/global-state";
import { PasswordGenerationServiceAbstraction } from "@bitwarden/common/tools/generator/password";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { SyncService } from "@bitwarden/common/vault/abstractions/sync/sync.service.abstraction";
import { FolderService } from "@bitwarden/common/vault/services/folder/folder.service";

import { collectionServiceFactory } from "../admin-console/background/service-factories/collection-service.factory";
import { policyServiceFactory } from "../admin-console/background/service-factories/policy-service.factory";
import { authServiceFactory } from "../auth/background/service-factories/auth-service.factory";
import { keyConnectorServiceFactory } from "../auth/background/service-factories/key-connector-service.factory";
import { cryptoServiceFactory } from "../background/service_factories/crypto-service.factory";
import {
  eventUploadServiceFactory,
  EventUploadServiceInitOptions,
} from "../background/service_factories/event-upload-service.factory";
import { CachedServices } from "../background/service_factories/factory-options";
import { messagingServiceFactory } from "../background/service_factories/messaging-service.factory";
import { passwordGenerationServiceFactory } from "../background/service_factories/password-generation-service.factory";
import { platformUtilsServiceFactory } from "../background/service_factories/platform-utils-service.factory";
import { searchServiceFactory } from "../background/service_factories/search-service.factory";
import { settingsServiceFactory } from "../background/service_factories/settings-service.factory";
import { stateServiceFactory } from "../background/service_factories/state-service.factory";
import { diskStorageServiceFactory } from "../background/service_factories/storage-service.factory";
import {
  syncServiceFactory,
  SyncServiceInitOptions,
} from "../background/service_factories/sync-service.factory";
import {
  systemServiceFactory,
  SystemServiceInitOptions,
} from "../background/service_factories/system-service.factory";
import { vaultTimeoutSettingsServiceFactory } from "../background/service_factories/vault-timeout-settings-service.factory";
import { Account } from "../models/account";
import {
  cipherServiceFactory,
  CipherServiceInitOptions,
} from "../vault/background/service_factories/cipher-service.factory";
import { folderServiceFactory } from "../vault/background/service_factories/folder-service.factory";
import { vaultFilterServiceFactory } from "../vault/background/service_factories/vault-filter-service.factory";
import { VaultFilterService } from "../vault/services/vault-filter.service";

import { BrowserApi } from "./browserApi";

const NOT_IMPLEMENTED = (...args: unknown[]) => Promise.resolve();

export class RuntimeHandler {
  constructor(
    private eventUploadService: EventUploadService,
    private syncService: SyncService,
    private cryptoService: CryptoService,
    private settingsService: SettingsService,
    private cipherService: CipherService,
    private folderService: FolderService,
    private collectionService: CollectionService,
    private policyService: PolicyService,
    private passwordGenerationService: PasswordGenerationServiceAbstraction,
    private vaultTimeoutSettingsService: VaultTimeoutSettingsService,
    private keyConnectorService: KeyConnectorService,
    private vaultFilterService: VaultFilterService,
    private stateService: StateService,
    private searchService: SearchService,
    private messagingService: MessagingService,
    private systemService: SystemService,
    private authService: AuthService,
    private storageService: AbstractStorageService,
    private platformUtilsService: PlatformUtilsService
  ) {}

  static async messageListener(
    message: any,
    sender: chrome.runtime.MessageSender,
    cachedServices: CachedServices
  ) {
    if (message.command !== "logout") {
      return;
    }

    const stateFactory = new StateFactory(GlobalState, Account);
    const serviceOptions: EventUploadServiceInitOptions &
      SyncServiceInitOptions &
      CipherServiceInitOptions &
      SystemServiceInitOptions = {
      apiServiceOptions: {
        logoutCallback: NOT_IMPLEMENTED,
      },
      cryptoFunctionServiceOptions: {
        win: self,
      },
      encryptServiceOptions: {
        logMacFailures: false,
      },
      i18nServiceOptions: {
        systemLanguage: chrome.i18n.getUILanguage(),
      },
      platformUtilsServiceOptions: {
        win: self,
        biometricCallback: () => Promise.resolve(false),
        clipboardWriteCallback: NOT_IMPLEMENTED,
      },
      keyConnectorServiceOptions: {
        logoutCallback: NOT_IMPLEMENTED,
      },
      logServiceOptions: {
        isDev: false,
      },
      stateMigrationServiceOptions: {
        stateFactory: stateFactory,
      },
      stateServiceOptions: {
        stateFactory: stateFactory,
      },
      syncServiceOptions: {
        logoutCallback: NOT_IMPLEMENTED,
      },
      systemServiceOptions: {
        reloadCallback: NOT_IMPLEMENTED,
      },
    };

    const runtimeHandler = new RuntimeHandler(
      await eventUploadServiceFactory(cachedServices, serviceOptions),
      await syncServiceFactory(cachedServices, serviceOptions),
      await cryptoServiceFactory(cachedServices, serviceOptions),
      await settingsServiceFactory(cachedServices, serviceOptions),
      await cipherServiceFactory(cachedServices, serviceOptions),
      await folderServiceFactory(cachedServices, serviceOptions),
      await collectionServiceFactory(cachedServices, serviceOptions),
      await policyServiceFactory(cachedServices, serviceOptions),
      await passwordGenerationServiceFactory(cachedServices, serviceOptions),
      await vaultTimeoutSettingsServiceFactory(cachedServices, serviceOptions),
      await keyConnectorServiceFactory(cachedServices, serviceOptions),
      await vaultFilterServiceFactory(cachedServices, serviceOptions),
      await stateServiceFactory(cachedServices, serviceOptions),
      await searchServiceFactory(cachedServices, serviceOptions),
      await messagingServiceFactory(cachedServices, serviceOptions),
      await systemServiceFactory(cachedServices, serviceOptions),
      await authServiceFactory(cachedServices, serviceOptions),
      await diskStorageServiceFactory(cachedServices, serviceOptions),
      await platformUtilsServiceFactory(cachedServices, serviceOptions)
    );

    await runtimeHandler.messageListener(message, sender);
  }

  async messageListener(message: any, sender: chrome.runtime.MessageSender) {
    switch (message.command) {
      case "logout":
        {
          const { userId, expired } = message;
          await this.eventUploadService.uploadEvents(userId);

          await Promise.allSettled([
            this.syncService.setLastSync(new Date(0), userId),
            this.cryptoService.clearKeys(userId),
            this.settingsService.clear(userId),
            this.cipherService.clear(userId),
            this.folderService.clear(userId),
            this.collectionService.clear(userId),
            this.policyService.clear(userId),
            this.passwordGenerationService.clear(userId),
            this.vaultTimeoutSettingsService.clear(userId),
            this.keyConnectorService.clear(),
            this.vaultFilterService.clear(), // TODO: This should really be done in popup
          ]);

          await this.stateService.clean({ userId: userId });

          if (userId == null || userId === (await this.stateService.getUserId())) {
            this.searchService.clearIndex();
            this.messagingService.send("doneLoggingOut", { expired: expired, userId: userId });
          }

          if (BrowserApi.manifestVersion === 3) {
            BrowserApi.sendMessage("updateBadge");
          }
          await this.reseedStorage();
          await this.systemService.clearPendingClipboard();
          await this.systemService.startProcessReload(this.authService);
        }
        break;
      default:
        break;
    }
  }

  private async reseedStorage() {
    if (
      !this.platformUtilsService.isChrome() &&
      !this.platformUtilsService.isVivaldi() &&
      !this.platformUtilsService.isOpera()
    ) {
      return;
    }

    const currentVaultTimeout = await this.stateService.getVaultTimeout();
    if (currentVaultTimeout == null) {
      return;
    }

    const getStorage = (): Promise<any> =>
      new Promise((resolve) => {
        chrome.storage.local.get(null, (o: any) => resolve(o));
      });

    const clearStorage = (): Promise<void> =>
      new Promise((resolve) => {
        chrome.storage.local.clear(() => resolve());
      });

    const storage = await getStorage();
    await clearStorage();

    for (const key in storage) {
      // eslint-disable-next-line
      if (!storage.hasOwnProperty(key)) {
        continue;
      }
      await this.storageService.save(key, storage[key]);
    }
  }
}
