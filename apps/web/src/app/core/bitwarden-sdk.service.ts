import { Injectable } from "@angular/core";

import { EnvironmentService } from "@bitwarden/common/abstractions/environment.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { TokenService } from "@bitwarden/common/auth/abstractions/token.service";
import { DeviceType } from "@bitwarden/common/enums/device-type.enum";
import { KdfType } from "@bitwarden/common/enums/kdf-type.enum";
import {
  BitwardenClient,
  Convert,
  DeviceType as DeviceType2,
  KdfType as KdfType2,
} from "@bitwarden/sdk-client";

@Injectable()
export class BitwardenSdkService {
  private client: BitwardenClient;

  constructor(
    private tokenService: TokenService,
    private environmentService: EnvironmentService,
    private platformUtilsService: PlatformUtilsService,
    private stateService: StateService
  ) {}

  async init(): Promise<void> {
    // TODO: Subscribe to account observable
    const kdfConfig = await this.stateService.getKdfConfig();

    // Build the SDK config. Currently consists of many internal settings that will be removed in the future.
    const settings_json = Convert.clientSettingsToJson({
      apiUrl: this.environmentService.getApiUrl(),
      identityUrl: this.environmentService.getIdentityUrl(),
      deviceType: this.toDevice(this.platformUtilsService.getDevice()),
      userAgent: navigator.userAgent,
      internal: {
        accessToken: await this.tokenService.getToken(),
        refreshToken: await this.tokenService.getRefreshToken(),
        expiresIn: await this.tokenService.tokenSecondsRemaining(),
        email: await this.tokenService.getEmail(),
        kdfType: this.toKdf(await this.stateService.getKdfType()),
        kdfIterations: kdfConfig.iterations,
      },
    });

    const module = await import("@bitwarden/sdk-wasm");
    this.client = new BitwardenClient(new module.BitwardenClient(settings_json, 0));
  }

  private toDevice(device: DeviceType): DeviceType2 {
    switch (device) {
      case DeviceType.Android:
        return DeviceType2.Android;
      case DeviceType.iOS:
        return DeviceType2.IOS;
      case DeviceType.ChromeExtension:
        return DeviceType2.ChromeExtension;
      case DeviceType.FirefoxExtension:
        return DeviceType2.FirefoxExtension;
      case DeviceType.OperaExtension:
        return DeviceType2.OperaExtension;
      case DeviceType.EdgeExtension:
        return DeviceType2.EdgeExtension;
      case DeviceType.WindowsDesktop:
        return DeviceType2.WindowsDesktop;
      case DeviceType.MacOsDesktop:
        return DeviceType2.MACOSDesktop;
      case DeviceType.LinuxDesktop:
        return DeviceType2.LinuxDesktop;
      case DeviceType.ChromeBrowser:
        return DeviceType2.ChromeBrowser;
      case DeviceType.FirefoxBrowser:
        return DeviceType2.FirefoxBrowser;
      case DeviceType.OperaBrowser:
        return DeviceType2.OperaBrowser;
      case DeviceType.EdgeBrowser:
        return DeviceType2.EdgeBrowser;
      case DeviceType.IEBrowser:
        return DeviceType2.IEBrowser;
      case DeviceType.UnknownBrowser:
        return DeviceType2.UnknownBrowser;
      case DeviceType.AndroidAmazon:
        return DeviceType2.AndroidAmazon;
      case DeviceType.UWP:
        return DeviceType2.UWP;
      case DeviceType.SafariBrowser:
        return DeviceType2.SafariBrowser;
      case DeviceType.VivaldiBrowser:
        return DeviceType2.VivaldiBrowser;
      case DeviceType.VivaldiExtension:
        return DeviceType2.VivaldiExtension;
      case DeviceType.SafariExtension:
        return DeviceType2.SafariExtension;
      case DeviceType.SDK:
        return DeviceType2.SDK;
      //case DeviceType.Server:
      //return DeviceType2.Server;
    }
  }

  private toKdf(kdf: KdfType): KdfType2 {
    switch (kdf) {
      case KdfType.PBKDF2_SHA256:
        return KdfType2.Pbkdf2Sha256;
      case KdfType.Argon2id:
        return KdfType2.Argon2ID;
    }
  }

  async getClient(): Promise<BitwardenClient> {
    if (this.client == null) {
      await this.init();
    }

    return this.client;
  }
}
