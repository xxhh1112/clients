import { Injectable } from "@angular/core";

import { UserVerificationPromptService as BaseUserVerificationPrompt } from "@bitwarden/angular/services/userVerificationPrompt.service";

import { UserVerificationPromptComponent } from "../app/components/user-verification-prompt.component";

@Injectable()
export class UserVerificationPromptService extends BaseUserVerificationPrompt {
  component = UserVerificationPromptComponent;
}
