import {
  BitwardenClient,
  Convert,
  DeviceType as SdkDeviceType,
  KdfType as SdkKdfType,
} from "@bitwarden/sdk-client";

import { BitwardenSdkServiceAbstraction } from "../abstractions/bitwarden-sdk.service.abstraction";
import { EnvironmentService } from "../abstractions/environment.service";
import { PlatformUtilsService } from "../abstractions/platformUtils.service";
import { StateService } from "../abstractions/state.service";
import { TokenService } from "../auth/abstractions/token.service";
import { DeviceType } from "../enums/device-type.enum";
import { KdfType } from "../enums/kdf-type.enum";

export class BitwardenSdkService implements BitwardenSdkServiceAbstraction {
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

  private toDevice(device: DeviceType): SdkDeviceType {
    switch (device) {
      case DeviceType.Android:
        return SdkDeviceType.Android;
      case DeviceType.iOS:
        return SdkDeviceType.IOS;
      case DeviceType.ChromeExtension:
        return SdkDeviceType.ChromeExtension;
      case DeviceType.FirefoxExtension:
        return SdkDeviceType.FirefoxExtension;
      case DeviceType.OperaExtension:
        return SdkDeviceType.OperaExtension;
      case DeviceType.EdgeExtension:
        return SdkDeviceType.EdgeExtension;
      case DeviceType.WindowsDesktop:
        return SdkDeviceType.WindowsDesktop;
      case DeviceType.MacOsDesktop:
        return SdkDeviceType.MACOSDesktop;
      case DeviceType.LinuxDesktop:
        return SdkDeviceType.LinuxDesktop;
      case DeviceType.ChromeBrowser:
        return SdkDeviceType.ChromeBrowser;
      case DeviceType.FirefoxBrowser:
        return SdkDeviceType.FirefoxBrowser;
      case DeviceType.OperaBrowser:
        return SdkDeviceType.OperaBrowser;
      case DeviceType.EdgeBrowser:
        return SdkDeviceType.EdgeBrowser;
      case DeviceType.IEBrowser:
        return SdkDeviceType.IEBrowser;
      case DeviceType.UnknownBrowser:
        return SdkDeviceType.UnknownBrowser;
      case DeviceType.AndroidAmazon:
        return SdkDeviceType.AndroidAmazon;
      case DeviceType.UWP:
        return SdkDeviceType.UWP;
      case DeviceType.SafariBrowser:
        return SdkDeviceType.SafariBrowser;
      case DeviceType.VivaldiBrowser:
        return SdkDeviceType.VivaldiBrowser;
      case DeviceType.VivaldiExtension:
        return SdkDeviceType.VivaldiExtension;
      case DeviceType.SafariExtension:
        return SdkDeviceType.SafariExtension;
      default:
        return SdkDeviceType.SDK;
    }
  }

  private toKdf(kdf: KdfType): SdkKdfType {
    switch (kdf) {
      case KdfType.PBKDF2_SHA256:
        return SdkKdfType.Pbkdf2Sha256;
      case KdfType.Argon2id:
        return SdkKdfType.Argon2ID;
    }
  }

  async getClient(): Promise<BitwardenClient> {
    if (this.client == null) {
      await this.init();
    }

    return this.client;
  }
}
