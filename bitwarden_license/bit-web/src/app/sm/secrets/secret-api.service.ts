import { Injectable } from "@angular/core";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { ListResponse } from "@bitwarden/common/models/response/listResponse";

import { SecretResponse } from "./responses/secret.response";

@Injectable({
  providedIn: "any",
})
export class SecretApiService {
  constructor(private apiService: ApiService) {}

  async getSecretsByOrganizationId(organizationId: string): Promise<ListResponse<SecretResponse>> {
    const r = await this.apiService.send(
      "GET",
      "/organizations/" + organizationId + "/secrets",
      null,
      true,
      true
    );
    return new ListResponse(r, SecretResponse);
  }
}
