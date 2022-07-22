import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PasswordGenerationService } from "@bitwarden/common/abstractions/passwordGeneration.service";

@Component({
  selector: "app-password-strength",
  templateUrl: "./password-strength.component.html",
})
export class PasswordStrengthComponent implements OnChanges {
  @Input() score: number;
  @Input() showText = false;
  @Input() email: string;
  @Input() password: string;
  @Input() name: string;

  scoreWidth = 0;
  color = "bg-danger";
  text: string;

  private masterPasswordStrengthTimeout: any;

  constructor(
    private i18nService: I18nService,
    private passwordGenerationService: PasswordGenerationService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.updatePasswordStrength(changes.password?.currentValue);

    this.scoreWidth = this.score == null ? 0 : (this.score + 1) * 20;
    switch (this.score) {
      case 4:
        this.color = "bg-success";
        this.text = this.i18nService.t("strong");
        break;
      case 3:
        this.color = "bg-primary";
        this.text = this.i18nService.t("good");
        break;
      case 2:
        this.color = "bg-warning";
        this.text = this.i18nService.t("weak");
        break;
      default:
        this.color = "bg-danger";
        this.text = this.score != null ? this.i18nService.t("weak") : null;
        break;
    }
  }

  updatePasswordStrength(password: string) {
    const masterPassword = password;

    if (this.masterPasswordStrengthTimeout != null) {
      clearTimeout(this.masterPasswordStrengthTimeout);
    }
    this.masterPasswordStrengthTimeout = setTimeout(() => {
      const strengthResult = this.passwordGenerationService.passwordStrength(
        masterPassword,
        this.getPasswordStrengthUserInput()
      );
      this.score = strengthResult == null ? null : strengthResult.score;
    }, 300);
  }

  getPasswordStrengthUserInput() {
    let userInput: string[] = [];
    const email = this.email;
    const name = this.name;
    const atPosition = email.indexOf("@");
    if (atPosition > -1) {
      userInput = userInput.concat(
        email
          .substr(0, atPosition)
          .trim()
          .toLowerCase()
          .split(/[^A-Za-z0-9]/)
      );
    }
    if (name != null && name !== "") {
      userInput = userInput.concat(name.trim().toLowerCase().split(" "));
    }
    return userInput;
  }
}
