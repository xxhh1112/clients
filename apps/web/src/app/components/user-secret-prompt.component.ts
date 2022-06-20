import { Component } from "@angular/core";

import { UserSecretPromptComponent as BaseUserSecretPrompt } from "@bitwarden/angular/components/user-secret-prompt.component";

@Component({
  templateUrl: "user-secret-prompt.component.html",
})
export class UserSecretPromptComponent extends BaseUserSecretPrompt {}
