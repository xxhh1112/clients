import { Injectable } from "@angular/core";
import { lastValueFrom } from "rxjs";

import { PasswordRepromptService as BasePasswordRepromptService } from "@bitwarden/angular/vault/services/password-reprompt.service";

import { PasswordRepromptComponent } from "../components/password-reprompt.component";

@Injectable()
export class PasswordRepromptService extends BasePasswordRepromptService {
  component = PasswordRepromptComponent;

  async showPasswordPrompt() {
    if (!(await this.enabled())) {
      return true;
    }

    const dialog = this.dialogService.open<boolean>(this.component, {
      ariaModal: true,
    });

    const result = await lastValueFrom(dialog.closed);

    return result === true;
  }
}
