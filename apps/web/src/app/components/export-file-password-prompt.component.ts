import { Component } from "@angular/core";

import { ExportFilePasswordPromptComponent as BaseExportFilePasswordPrompt } from "@bitwarden/angular/components/export-file-password-prompt.component";

@Component({
  templateUrl: "export-file-password-prompt.component.html",
})
export class ExportFilePasswordPromptComponent extends BaseExportFilePasswordPrompt {}
