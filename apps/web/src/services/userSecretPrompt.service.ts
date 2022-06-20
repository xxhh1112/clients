import { Injectable } from "@angular/core";

import { UserSecretPromptService as BaseUserSecretPrompt } from "@bitwarden/angular/services/userSecretPrompt.service";

import { UserSecretPromptComponent } from "../app/components/user-secret-prompt.component";

@Injectable()
export class UserSecretPromptService extends BaseUserSecretPrompt {
  component = UserSecretPromptComponent;
}
