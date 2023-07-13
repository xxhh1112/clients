import { SecretVerificationRequest } from "../../auth/models/request/secret-verification.request";
import { DeviceType } from "../../enums";
import { ListResponse } from "../../models/response/list.response";

import { UpdateDevicesTrustRequest } from "./requests/update-devices-trust.request";
import { DeviceResponse } from "./responses/device.response";
import { ProtectedDeviceResponse } from "./responses/protected-device.response";

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

  updateTrust: (updateDevicesTrustRequestModel: UpdateDevicesTrustRequest) => Promise<void>;

  getDeviceKeys: (
    deviceIdentifier: string,
    secretVerificationRequest: SecretVerificationRequest
  ) => Promise<ProtectedDeviceResponse>;
}
