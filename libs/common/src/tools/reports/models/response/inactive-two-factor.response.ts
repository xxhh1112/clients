import { BaseResponse } from "../../../../models/response/base.response";

interface ReadonlyStringDictionaryObject {
  readonly [key: string]: string;
}

export class InactiveTwoFactorReponse extends BaseResponse {
  services: Map<string, string>;

  constructor(response: any) {
    super(response);
    const servicesData: ReadonlyStringDictionaryObject = this.getResponseProperty("Services");
    this.services = new Map(Object.entries(servicesData));
  }
}
