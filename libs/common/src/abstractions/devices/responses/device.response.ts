import { DeviceType } from "../../../enums";
import { BaseResponse } from "../../../models/response/base.response";

export class DeviceResponse extends BaseResponse {
  id: string;
  userId: string;
  name: number;
  identifier: string;
  type: DeviceType;
  creationDate: string;
  revisionDate: string;
  encryptedUserKey: string;
  encryptedPublicKey: string;
  encryptedPrivateKey: string;

  constructor(response: any) {
    super(response);
    this.id = this.getResponseProperty("Id");
    this.userId = this.getResponseProperty("UserId");
    this.name = this.getResponseProperty("Name");
    this.identifier = this.getResponseProperty("Identifier");
    this.type = this.getResponseProperty("Type");
    this.creationDate = this.getResponseProperty("CreationDate");
    this.revisionDate = this.getResponseProperty("RevisionDate");
    this.encryptedUserKey = this.getResponseProperty("EncryptedUserKey");
    this.encryptedPublicKey = this.getResponseProperty("EncryptedPublicKey");
    this.encryptedPrivateKey = this.getResponseProperty("EncryptedPrivateKey");
  }
}
