import { ChallengeResponse } from "@bitwarden/common/auth/models/response/two-factor-web-authn.response";

export class NewCredentialOptionsView {
  constructor(readonly challenge: ChallengeResponse) {}
}
