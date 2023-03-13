import { Inject } from "@angular/core";

import { WINDOW } from "@bitwarden/angular/services/injection-tokens";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { EncryptService } from "@bitwarden/common/abstractions/encrypt.service";
import { EnvironmentService } from "@bitwarden/common/abstractions/environment.service";
import { EventUploadService as EventUploadServiceAbstraction } from "@bitwarden/common/abstractions/event/event-upload.service";
import { I18nService as I18nServiceAbstraction } from "@bitwarden/common/abstractions/i18n.service";
import { NotificationsService } from "@bitwarden/common/abstractions/notifications.service";
import { VaultTimeoutService as VaultTimeoutServiceAbstraction } from "@bitwarden/common/abstractions/vaultTimeout/vaultTimeout.service";
import { TwoFactorService } from "@bitwarden/common/auth/abstractions/two-factor.service";
import { ContainerService } from "@bitwarden/common/services/container.service";
import { EventUploadService } from "@bitwarden/common/services/event/event-upload.service";
import { I18nService } from "@bitwarden/common/services/i18n.service";

import VaultTimeoutService from "../../services/vaultTimeout/vaultTimeout.service";

import { InitService } from "./init.service";

export abstract class PopupInitializer {
  constructor(
    private cryptoService: CryptoService,
    private encryptService: EncryptService,
    @Inject(WINDOW) private win: Window,
    private initService: InitService,
    private vaultTimeoutService: VaultTimeoutServiceAbstraction,
    private i18nService: I18nServiceAbstraction,
    private eventUploadService: EventUploadServiceAbstraction,
    private twoFactorService: TwoFactorService
  ) {}

  async initialize(): Promise<void> {
    const containerService = new ContainerService(this.cryptoService, this.encryptService);
    containerService.attachToGlobal(this.win);

    await this.initService.init()();

    (this.vaultTimeoutService as VaultTimeoutService).init(true);
    await (this.i18nService as I18nService).init();

    (this.eventUploadService as EventUploadService).init(true);

    this.twoFactorService.init();
  }
}

export class Mv3PopupInitializer extends PopupInitializer {
  constructor(
    cryptoService: CryptoService,
    encryptService: EncryptService,
    @Inject(WINDOW) win: Window,
    initService: InitService,
    vaultTimeoutService: VaultTimeoutServiceAbstraction,
    i18nService: I18nServiceAbstraction,
    eventUploadService: EventUploadServiceAbstraction,
    twoFactorService: TwoFactorService,
    private environmentService: EnvironmentService,
    private notificationsService: NotificationsService
  ) {
    super(
      cryptoService,
      encryptService,
      win,
      initService,
      vaultTimeoutService,
      i18nService,
      eventUploadService,
      twoFactorService
    );
  }

  async initialize(): Promise<void> {
    await super.initialize();

    // This should still probably be done in the background
    await this.environmentService.setUrlsFromStorage();

    this.notificationsService.init();
  }
}

export class Mv2PopupInitializer extends PopupInitializer {
  async initialize(): Promise<void> {
    await super.initialize();
  }
}
