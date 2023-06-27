import { DeviceType } from "../../enums";
import { ListResponse } from "../../models/response/list.response";

import { DeviceResponse } from "./responses/device.response";

export abstract class DevicesApiServiceAbstraction {
  getKnownDevice: (email: string, deviceIdentifier: string) => Promise<boolean>;

  getDeviceByIdentifier: (deviceIdentifier: string) => Promise<DeviceResponse>;

  getDevices: () => Promise<ListResponse<DeviceResponse>>;
  getDevicesExistenceByTypes: (deviceTypes: DeviceType[]) => Promise<boolean>;

  updateTrustedDeviceKeys: (
    deviceIdentifier: string,
    devicePublicKeyEncryptedUserKey: string,
    userKeyEncryptedDevicePublicKey: string,
    deviceKeyEncryptedDevicePrivateKey: string
  ) => Promise<DeviceResponse>;
}
