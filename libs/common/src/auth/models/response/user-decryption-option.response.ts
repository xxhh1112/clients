import { BaseResponse } from "../../../models/response/base.response";

export class UserDecryptionOptionResponse extends BaseResponse {
  object: string;

  constructor(response: any) {
    super(response);

    this.object = this.getResponseProperty("Object");
  }
}
