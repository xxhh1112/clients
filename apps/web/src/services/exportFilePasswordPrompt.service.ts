import { Injectable } from "@angular/core";

import { ExportFilePasswordPromptService as BaseExportFilePasswordPrompt } from "@bitwarden/angular/services/exportFilePasswordPrompt.service";

import { ExportFilePasswordPromptComponent } from "../app/components/export-file-password-prompt.component";

@Injectable()
export class ExportFilePasswordPromptService extends BaseExportFilePasswordPrompt {
  component = ExportFilePasswordPromptComponent;
}
