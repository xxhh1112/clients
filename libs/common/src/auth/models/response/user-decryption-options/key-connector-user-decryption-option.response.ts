import { BaseResponse } from "../../../../models/response/base.response";

export class KeyConnectorUserDecryptionOptionResponse extends BaseResponse {
  keyConnectorUrl: string;

  constructor(response: any) {
    super(response);
    this.keyConnectorUrl = this.getResponseProperty("KeyConnectorUrl");
  }
}
