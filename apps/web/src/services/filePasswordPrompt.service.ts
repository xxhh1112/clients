import { Injectable } from "@angular/core";

import { FilePasswordPromptService as BaseFilePasswordPromptService } from "@bitwarden/angular/services/filePasswordPrompt.service";

import { FilePasswordPromptComponent } from "../app/components/file-password-prompt.component";

@Injectable()
export class FilePasswordPromptService extends BaseFilePasswordPromptService {
  component = FilePasswordPromptComponent;
}
