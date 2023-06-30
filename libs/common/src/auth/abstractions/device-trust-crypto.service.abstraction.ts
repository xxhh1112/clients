import { DeviceResponse } from "../../abstractions/devices/responses/device.response";
import { DeviceKey, UserKey } from "../../platform/models/domain/symmetric-crypto-key";

export abstract class DeviceTrustCryptoServiceAbstraction {
  /**
   * @description Retrieves the users choice to trust the device which can only happen after decryption
   * Note: this value should only be used once and then reset
   */
  getUserTrustDeviceChoiceForDecryption: () => Promise<boolean>;
  setUserTrustDeviceChoiceForDecryption: (value: boolean) => Promise<void>;

  trustDevice: () => Promise<DeviceResponse>;
  getDeviceKey: () => Promise<DeviceKey>;
  // TODO: update param types when available
  decryptUserKeyWithDeviceKey: (
    encryptedDevicePrivateKey: any,
    encryptedUserKey: any
  ) => Promise<UserKey>;
}
