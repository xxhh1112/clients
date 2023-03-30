import { ApiService } from "../../abstractions/api.service";
import { EnvironmentService } from "../../abstractions/environment.service";
import { SsoApiService as SsoApiServiceAbstraction } from "../abstractions/sso-api.service.abstraction";
import { SsoPreValidateResponse } from "../models/response/sso-pre-validate.response";

export class SsoApiServiceImplementation implements SsoApiServiceAbstraction {
  constructor(private environmentService: EnvironmentService, private apiService: ApiService) {}

  async preValidateSso(identifier: string): Promise<SsoPreValidateResponse> {
    if (identifier == null || identifier === "") {
      throw new Error("Organization Identifier was not provided.");
    }
    const responseBody = await this.apiService.send(
      "GET",
      `/sso/prevalidate?domainHint=${encodeURIComponent(identifier)}`,
      null,
      false,
      true,
      this.environmentService.getIdentityUrl()
    );

    return new SsoPreValidateResponse(responseBody);
  }
}
