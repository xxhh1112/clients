import { Injectable } from "@angular/core";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { UserVerificationService } from "@bitwarden/common/abstractions/userVerification/userVerification.service.abstraction";
import { ListResponse } from "@bitwarden/common/models/response/list.response";
import { Verification } from "@bitwarden/common/types/verification";

import { CoreAuthModule } from "../../core.module";

import { SaveCredentialRequest } from "./request/save-credential.request";
import { CredentialCreateOptionsResponse } from "./response/credential-create-options.response";
import { WebauthnCredentialResponse } from "./response/webauthn-credential.response";

@Injectable({ providedIn: CoreAuthModule })
export class WebauthnApiService {
  constructor(
    private apiService: ApiService,
    private userVerificationService: UserVerificationService
  ) {}

  async getCredentialCreateOptions(
    verification: Verification
  ): Promise<CredentialCreateOptionsResponse> {
    const request = await this.userVerificationService.buildRequest(verification);
    const response = await this.apiService.send("POST", "/webauthn/options", request, true, true);
    return new CredentialCreateOptionsResponse(response);
  }

  async saveCredential(request: SaveCredentialRequest): Promise<boolean> {
    await this.apiService.send("POST", "/webauthn", request, true, true);
    return true;
  }

  getCredentials(): Promise<ListResponse<WebauthnCredentialResponse>> {
    return this.apiService.send("GET", "/webauthn", null, true, true);
  }
}
