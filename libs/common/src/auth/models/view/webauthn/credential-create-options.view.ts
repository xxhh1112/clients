import { ChallengeResponse } from "../../response/two-factor-web-authn.response";

export class CredentialCreateOptionsView {
  constructor(readonly options: ChallengeResponse, readonly token: string) {}
}
