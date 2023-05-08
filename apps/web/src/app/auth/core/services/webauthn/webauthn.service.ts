import { Injectable } from "@angular/core";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { UserVerificationService } from "@bitwarden/common/abstractions/userVerification/userVerification.service.abstraction";
import { ChallengeResponse } from "@bitwarden/common/auth/models/response/two-factor-web-authn.response";
import { Verification } from "@bitwarden/common/types/verification";

import { CoreAuthModule } from "../../core.module";

@Injectable({ providedIn: CoreAuthModule })
export class WebauthnService {
  constructor(
    private apiService: ApiService,
    private userVerificationService: UserVerificationService
  ) {}

  async newCredentialOptions(verification: Verification): Promise<ChallengeResponse> {
    const request = await this.userVerificationService.buildRequest(verification);
    const response = await this.apiService.send("POST", "/webauthn/options", request, true, true);
    return new ChallengeResponse(response);
  }
}
