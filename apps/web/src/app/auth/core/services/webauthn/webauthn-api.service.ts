import { Injectable } from "@angular/core";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { UserVerificationService } from "@bitwarden/common/abstractions/userVerification/userVerification.service.abstraction";
import { Verification } from "@bitwarden/common/types/verification";

import { CoreAuthModule } from "../../core.module";

import { CredentialCreateOptionsResponse } from "./response/credential-create-options.response";

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
}
