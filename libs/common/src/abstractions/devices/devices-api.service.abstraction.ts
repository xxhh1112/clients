import { ListResponse } from "../../models/response/list.response";

import { DeviceResponse } from "./responses/device.response";

export abstract class DevicesApiServiceAbstraction {
  getKnownDevice: (email: string, deviceIdentifier: string) => Promise<boolean>;

  getDeviceByIdentifier: (deviceIdentifier: string) => Promise<DeviceResponse>;

  getDevices: () => Promise<ListResponse<DeviceResponse>>;

  updateTrustedDeviceKeys: (
    deviceIdentifier: string,
    devicePublicKeyEncryptedUserSymKey: string,
    userSymKeyEncryptedDevicePublicKey: string,
    deviceKeyEncryptedDevicePrivateKey: string
  ) => Promise<DeviceResponse>;
}
