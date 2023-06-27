import { Observable } from "rxjs";

import { DeviceType } from "../../enums";

import { DeviceView } from "./views/device.view";

export abstract class DevicesServiceAbstraction {
  getDevices$: () => Observable<Array<DeviceView>>;
  getDevicesExistenceByTypes$: (deviceTypes: DeviceType[]) => Observable<boolean>;
  getDeviceByIdentifier$: (deviceIdentifier: string) => Observable<DeviceView>;
  isDeviceKnownForUser$: (email: string, deviceIdentifier: string) => Observable<boolean>;
  updateTrustedDeviceKeys$: (
    deviceIdentifier: string,
    devicePublicKeyEncryptedUserKey: string,
    userKeyEncryptedDevicePublicKey: string,
    deviceKeyEncryptedDevicePrivateKey: string
  ) => Observable<DeviceView>;
}
