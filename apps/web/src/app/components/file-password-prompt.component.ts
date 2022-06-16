import { Component } from "@angular/core";

import { FilePasswordPromptComponent as BaseFilePasswordPrompt } from "@bitwarden/angular/components/file-password-prompt.component";

@Component({
  templateUrl: "file-password-prompt.component.html",
})
export class FilePasswordPromptComponent extends BaseFilePasswordPrompt {}
