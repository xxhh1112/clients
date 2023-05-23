import { Injectable } from "@angular/core";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { EnvironmentService } from "@bitwarden/common/abstractions/environment.service";
import { UserVerificationService } from "@bitwarden/common/abstractions/userVerification/userVerification.service.abstraction";
import { ListResponse } from "@bitwarden/common/models/response/list.response";
import { Verification } from "@bitwarden/common/types/verification";

import { SaveCredentialRequest } from "./request/save-credential.request";
import { WebauthnAssertionResponseRequest } from "./request/webauthn-assertion-response.request";
import { CredentialAssertionOptionsResponse } from "./response/credential-assertion-options.response";
import { CredentialCreateOptionsResponse } from "./response/credential-create-options.response";
import { WebauthnAssertionResponse } from "./response/webauthn-assertion.response";
import { WebauthnCredentialResponse } from "./response/webauthn-credential.response";

@Injectable({ providedIn: "root" })
export class WebauthnApiService {
  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
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

  async deleteCredential(credentialId: string, verification: Verification): Promise<void> {
    const request = await this.userVerificationService.buildRequest(verification);
    await this.apiService.send("POST", `/webauthn/${credentialId}/delete`, request, true, true);
  }

  async getCredentialAssertionOptions(email?: string): Promise<CredentialAssertionOptionsResponse> {
    const response = await this.apiService.send(
      "POST",
      `/accounts/webauthn-assertion-options`,
      { email: email ?? null },
      false,
      true,
      this.environmentService.getIdentityUrl()
    );
    return new CredentialAssertionOptionsResponse(response);
  }

  async assertCredential(request: WebauthnAssertionResponseRequest): Promise<string> {
    const response = await this.apiService.send(
      "POST",
      `/accounts/webauthn-assertion`,
      request,
      false,
      true,
      this.environmentService.getIdentityUrl()
    );
    const responseModel = new WebauthnAssertionResponse(response);
    return responseModel.token;
  }
}
