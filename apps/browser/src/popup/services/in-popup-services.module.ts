import { APP_INITIALIZER, LOCALE_ID, NgModule } from "@angular/core";

import { LockGuard as BaseLockGuardService } from "@bitwarden/angular/guards/lock.guard";
import { UnauthGuard as BaseUnauthGuardService } from "@bitwarden/angular/guards/unauth.guard";
import {
  MEMORY_STORAGE,
  SECURE_STORAGE,
  WINDOW,
} from "@bitwarden/angular/services/injection-tokens";
import { CipherService } from "@bitwarden/common/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { CryptoFunctionService } from "@bitwarden/common/abstractions/cryptoFunction.service";
import { EncryptService } from "@bitwarden/common/abstractions/encrypt.service";
import { EnvironmentService } from "@bitwarden/common/abstractions/environment.service";
import { EventCollectionService } from "@bitwarden/common/abstractions/event/event-collection.service";
import { EventUploadService as EventUploadServiceAbstraction } from "@bitwarden/common/abstractions/event/event-upload.service";
import { FileDownloadService } from "@bitwarden/common/abstractions/fileDownload/fileDownload.service";
import { FolderService } from "@bitwarden/common/abstractions/folder/folder.service.abstraction";
import { I18nService as I18nServiceAbstraction } from "@bitwarden/common/abstractions/i18n.service";
import { LogService as LogServiceAbstraction } from "@bitwarden/common/abstractions/log.service";
import { MessagingService } from "@bitwarden/common/abstractions/messaging.service";
import { OrganizationService } from "@bitwarden/common/abstractions/organization/organization.service.abstraction";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { PolicyService } from "@bitwarden/common/abstractions/policy/policy.service.abstraction";
import { StateService as BaseStateServiceAbstraction } from "@bitwarden/common/abstractions/state.service";
import { StateMigrationService } from "@bitwarden/common/abstractions/stateMigration.service";
import {
  AbstractMemoryStorageService,
  AbstractStorageService,
} from "@bitwarden/common/abstractions/storage.service";
import { SystemService as SystemServiceAbstraction } from "@bitwarden/common/abstractions/system.service";
import { TotpService } from "@bitwarden/common/abstractions/totp.service";
import { TwoFactorService } from "@bitwarden/common/abstractions/twoFactor.service";
import { VaultTimeoutService as VaultTimeoutServiceAbstraction } from "@bitwarden/common/abstractions/vaultTimeout/vaultTimeout.service";
import { StateFactory } from "@bitwarden/common/factories/stateFactory";
import { GlobalState } from "@bitwarden/common/models/domain/global-state";
import { ContainerService } from "@bitwarden/common/services/container.service";
import { EncryptServiceImplementation } from "@bitwarden/common/services/cryptography/encrypt.service.implementation";
import { EventUploadService } from "@bitwarden/common/services/event/event-upload.service";
import { MemoryStorageService } from "@bitwarden/common/services/memoryStorage.service";
import { SystemService } from "@bitwarden/common/services/system.service";

import { NativeMessagingBackground } from "../../background/nativeMessaging.background";
import { BrowserApi } from "../../browser/browserApi";
import { Account } from "../../models/account";
import { AutofillService as AutofillServiceAbstraction } from "../../services/abstractions/autofill.service";
import { BrowserStateService as StateServiceAbstraction } from "../../services/abstractions/browser-state.service";
import AutofillService from "../../services/autofill.service";
import { BrowserEnvironmentService } from "../../services/browser-environment.service";
import { BrowserStateService } from "../../services/browser-state.service";
import { BrowserFileDownloadService } from "../../services/browserFileDownloadService";
import BrowserLocalStorageService from "../../services/browserLocalStorage.service";
import BrowserMessagingService from "../../services/browserMessaging.service";
import BrowserMessagingPrivateModeBackgroundService from "../../services/browserMessagingPrivateModeBackground.service";
import I18nService from "../../services/i18n.service";
import { ManifestVersion, MANIFEST_VERSION } from "../../services/injection-tokens";
import { KeyGenerationService } from "../../services/keyGeneration.service";
import { LocalBackedSessionStorageService } from "../../services/localBackedSessionStorage.service";
import { VaultFilterService } from "../../services/vaultFilter.service";
import VaultTimeoutService from "../../services/vaultTimeout/vaultTimeout.service";
import { AppComponent } from "../app.component";

import { InitService } from "./init.service";
import { LockGuardService } from "./lock-guard.service";
import { PopupBrowserPlatformUtilsService } from "./popup-browser-platform-utils.service";
import { PopupUtilsService } from "./popup-utils.service";
import { UnauthGuardService } from "./unauth-guard.service";

@NgModule({
  providers: [
    {
      provide: LOCALE_ID,
      useFactory: (i18nService: I18nServiceAbstraction) => i18nService.translationLocale,
      deps: [I18nServiceAbstraction],
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (
        cryptoService: CryptoService,
        encryptService: EncryptService,
        initService: InitService,
        vaultTimeoutService: VaultTimeoutServiceAbstraction,
        i18nService: I18nServiceAbstraction,
        eventUploadService: EventUploadServiceAbstraction,
        twoFactorService: TwoFactorService,
        window: Window
      ) => {
        // TODO: This could be refactored
        // This emulates main.background.ts bootstrap()
        return async () => {
          const container = new ContainerService(cryptoService, encryptService);
          container.attachToGlobal(window);

          // This already does stateservice.init()
          await initService.init()();
          // All these casts are not ideal
          // TODO: Since this isn't async this feels like it should be in the constructor?
          (vaultTimeoutService as VaultTimeoutService).init(true);
          await (i18nService as I18nService).init();
          // Also feels like ctor work
          (eventUploadService as EventUploadService).init(true);
          // Same
          twoFactorService.init();

          // TODO: Notifications service?
        };
      },
      deps: [
        CryptoService,
        EncryptService,
        InitService,
        VaultTimeoutServiceAbstraction,
        I18nServiceAbstraction,
        EventUploadServiceAbstraction,
        TwoFactorService,
        WINDOW,
      ],
      multi: true,
    },
    {
      provide: MANIFEST_VERSION,
      useFactory: () => BrowserApi.manifestVersion,
    },
    { provide: BaseLockGuardService, useClass: LockGuardService },
    { provide: BaseUnauthGuardService, useClass: UnauthGuardService },
    { provide: PopupUtilsService, useFactory: () => new PopupUtilsService(false) },
    {
      provide: MessagingService,
      // TODO: This totally gets rid of in process messaging towards what was a fake in process background service
      // this will probably need a replacement
      useFactory: () => {
        return new (class extends MessagingService {
          backgroundMessaging = new BrowserMessagingService();
          inProcessMessaging = new BrowserMessagingPrivateModeBackgroundService();

          send = (subscriber: string, arg: any = {}) => {
            this.backgroundMessaging.send(subscriber, arg);
            this.inProcessMessaging.send(subscriber, arg);
          };
        })();
      },
    },
    {
      provide: I18nServiceAbstraction,
      useFactory: () => new I18nService(BrowserApi.getUILanguage(undefined)),
    },
    {
      provide: PlatformUtilsService,
      useFactory: (
        i18nService: I18nServiceAbstraction,
        messagingService: MessagingService,
        nativeMessagingBackground: NativeMessagingBackground,
        systemService: SystemServiceAbstraction
      ) => {
        return new PopupBrowserPlatformUtilsService(
          i18nService,
          messagingService,
          (clipboardValue, clearMs) => {
            if (systemService != null) {
              systemService.clearClipboard(clipboardValue, clearMs);
            }
          },
          async () => {
            if (nativeMessagingBackground != null) {
              const promise = nativeMessagingBackground.getResponse();

              try {
                await nativeMessagingBackground.send({ command: "biometricUnlock" });
              } catch (e) {
                return Promise.reject(e);
              }

              return promise.then((result) => result.response === "unlocked");
            }
          },
          window
        );
      },
      deps: [
        I18nServiceAbstraction,
        MessagingService,
        NativeMessagingBackground,
        SystemServiceAbstraction,
      ],
    },
    {
      provide: NativeMessagingBackground,
      useFactory: () => {
        return null as any; // TODO: Implement this
      },
    },
    {
      provide: SystemServiceAbstraction,
      useFactory: (
        messagingService: MessagingService,
        platformUtilsService: PlatformUtilsService,
        stateService: StateServiceAbstraction
      ) => {
        const systemUtilsServiceReloadCallback = () => {
          const forceWindowReload =
            platformUtilsService.isSafari() ||
            platformUtilsService.isFirefox() ||
            platformUtilsService.isOpera();
          BrowserApi.reloadExtension(forceWindowReload ? window : null);
          return Promise.resolve();
        };

        return new SystemService(
          messagingService,
          platformUtilsService,
          systemUtilsServiceReloadCallback,
          stateService
        );
      },
    },
    {
      provide: AbstractStorageService,
      useClass: BrowserLocalStorageService,
    },
    {
      provide: SECURE_STORAGE,
      useExisting: AbstractStorageService,
    },
    {
      provide: MEMORY_STORAGE,
      useFactory: (
        manifestVersion: ManifestVersion,
        cryptoFunctionService: CryptoFunctionService,
        logService: LogServiceAbstraction
      ) => {
        if (manifestVersion === 2) {
          return new MemoryStorageService();
        } else {
          return new LocalBackedSessionStorageService(
            new EncryptServiceImplementation(cryptoFunctionService, logService, false),
            new KeyGenerationService(cryptoFunctionService)
          );
        }
      },
      deps: [MANIFEST_VERSION, CryptoFunctionService, LogServiceAbstraction],
    },
    {
      provide: StateServiceAbstraction,
      useFactory: (
        storageService: AbstractStorageService,
        secureStorageService: AbstractStorageService,
        memoryStorageService: AbstractMemoryStorageService,
        logService: LogServiceAbstraction,
        stateMigrationService: StateMigrationService
      ) => {
        return new BrowserStateService(
          storageService,
          secureStorageService,
          memoryStorageService,
          logService,
          stateMigrationService,
          new StateFactory(GlobalState, Account)
        );
      },
      deps: [
        AbstractStorageService,
        SECURE_STORAGE,
        MEMORY_STORAGE,
        LogServiceAbstraction,
        StateMigrationService,
      ],
    },
    {
      provide: BaseStateServiceAbstraction,
      useExisting: StateServiceAbstraction,
      deps: [],
    },
    {
      provide: BrowserEnvironmentService,
      useExisting: EnvironmentService,
    },
    {
      provide: EnvironmentService,
      useClass: BrowserEnvironmentService,
      deps: [StateServiceAbstraction, LogServiceAbstraction],
    },
    {
      provide: VaultFilterService,
      useClass: VaultFilterService,
      deps: [
        StateServiceAbstraction,
        OrganizationService,
        FolderService,
        CipherService,
        CollectionService,
        PolicyService,
      ],
    },
    {
      provide: AutofillServiceAbstraction,
      useClass: AutofillService,
      deps: [
        CipherService,
        StateServiceAbstraction,
        TotpService,
        EventCollectionService,
        LogServiceAbstraction,
      ],
    },
    {
      provide: FileDownloadService,
      useClass: BrowserFileDownloadService,
    },
  ],
  bootstrap: [AppComponent],
})
export class InPopupServices {}
