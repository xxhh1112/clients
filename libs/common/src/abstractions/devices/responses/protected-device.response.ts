import { Jsonify } from "type-fest";

import { DeviceType } from "../../../enums";
import { BaseResponse } from "../../../models/response/base.response";

export class ProtectedDeviceResponse extends BaseResponse {
  constructor(response: Jsonify<ProtectedDeviceResponse>) {
    super(response);
    this.id = this.getResponseProperty("id");
    this.name = this.getResponseProperty("name");
    this.identifier = this.getResponseProperty("identifier");
    this.type = this.getResponseProperty("type");
    this.creationDate = new Date(this.getResponseProperty("creationDate"));
    this.encryptedUserKey = this.getResponseProperty("encryptedUserKey");
    this.encryptedPublicKey = this.getResponseProperty("encryptedPublicKey");
  }

  id: string;
  name: string;
  type: DeviceType;
  identifier: string;
  creationDate: Date;
  /**
   * Intended to be the users symmetric key that is encrypted in some form, the current way to encrypt this is with
   * the devices public key.
   */
  encryptedUserKey: string;
  /**
   * Intended to be the public key that was generated for a device upon trust and encrypted. Currenly encrypted using
   * a users symmetric key so that when trusted and unlocked a user can decrypt the public key for all their devices.
   * This enabled a user to rotate the keys for all of their devices.
   */
  encryptedPublicKey: string;
}
