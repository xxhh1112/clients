import { DeviceCryptoServiceAbstraction } from "../abstractions/device-crypto.service.abstraction";
import { DevicesApiServiceAbstraction } from "../abstractions/devices/devices-api.service.abstraction";
import { DeviceResponse } from "../abstractions/devices/responses/device.response";
import { AppIdService } from "../platform/abstractions/app-id.service";
import { CryptoFunctionService } from "../platform/abstractions/crypto-function.service";
import { CryptoService } from "../platform/abstractions/crypto.service";
import { EncryptService } from "../platform/abstractions/encrypt.service";
import { StateService } from "../platform/abstractions/state.service";
import {
  SymmetricCryptoKey,
  DeviceKey,
  UserKey,
} from "../platform/models/domain/symmetric-crypto-key";
import { CsprngArray } from "../types/csprng";

export class DeviceCryptoService implements DeviceCryptoServiceAbstraction {
  constructor(
    protected cryptoFunctionService: CryptoFunctionService,
    protected cryptoService: CryptoService,
    protected encryptService: EncryptService,
    protected stateService: StateService,
    protected appIdService: AppIdService,
    protected devicesApiService: DevicesApiServiceAbstraction
  ) {}

  async trustDevice(): Promise<DeviceResponse> {
    // Attempt to get user key
    const userKey: UserKey = await this.cryptoService.getUserKey();

    // If user key is not found, throw error
    if (!userKey) {
      throw new Error("User symmetric key not found");
    }

    // Generate deviceKey
    const deviceKey = await this.makeDeviceKey();

    // Generate asymmetric RSA key pair: devicePrivateKey, devicePublicKey
    const [devicePublicKey, devicePrivateKey] = await this.cryptoFunctionService.rsaGenerateKeyPair(
      2048
    );

    const [
      devicePublicKeyEncryptedUserKey,
      userKeyEncryptedDevicePublicKey,
      deviceKeyEncryptedDevicePrivateKey,
    ] = await Promise.all([
      // Encrypt user key with the DevicePublicKey
      this.cryptoService.rsaEncrypt(userKey.encKey, devicePublicKey),

      // Encrypt devicePublicKey with user key
      this.encryptService.encrypt(devicePublicKey, userKey),

      // Encrypt devicePrivateKey with deviceKey
      this.encryptService.encrypt(devicePrivateKey, deviceKey),
    ]);

    // Send encrypted keys to server
    const deviceIdentifier = await this.appIdService.getAppId();
    return this.devicesApiService.updateTrustedDeviceKeys(
      deviceIdentifier,
      devicePublicKeyEncryptedUserKey.encryptedString,
      userKeyEncryptedDevicePublicKey.encryptedString,
      deviceKeyEncryptedDevicePrivateKey.encryptedString
    );
  }

  async getDeviceKey(): Promise<DeviceKey> {
    // Check if device key is already stored
    const existingDeviceKey = await this.stateService.getDeviceKey();

    if (existingDeviceKey != null) {
      return existingDeviceKey;
    } else {
      return this.makeDeviceKey();
    }
  }

  private async makeDeviceKey(): Promise<DeviceKey> {
    // Create 512-bit device key
    const randomBytes: CsprngArray = await this.cryptoFunctionService.randomBytes(64);
    const deviceKey = new SymmetricCryptoKey(randomBytes) as DeviceKey;

    // Save device key in secure storage
    await this.stateService.setDeviceKey(deviceKey);

    return deviceKey;
  }
}
