import { Component, OnInit } from "@angular/core";
import { Observable } from "rxjs";

import { ModalService } from "@bitwarden/angular/services/modal.service";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { PasswordStrengthServiceAbstraction } from "@bitwarden/common/tools/password-strength";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { PasswordRepromptService } from "@bitwarden/common/vault/abstractions/password-reprompt.service";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { BadgeTypes } from "@bitwarden/components";

import { CipherReportComponent } from "./cipher-report.component";

@Component({
  selector: "app-weak-passwords-report",
  templateUrl: "weak-passwords-report.component.html",
})
export class WeakPasswordsReportComponent extends CipherReportComponent implements OnInit {
  passwordStrengthMap = new Map<string, [string, BadgeTypes]>();
  disabled = true;
  organizations$: Observable<Organization[]>;

  private passwordStrengthCache = new Map<string, number>();
  weakPasswordCiphers: CipherView[] = [];

  constructor(
    protected cipherService: CipherService,
    protected passwordStrengthService: PasswordStrengthServiceAbstraction,
    protected organizationService: OrganizationService,
    modalService: ModalService,
    passwordRepromptService: PasswordRepromptService
  ) {
    super(modalService, passwordRepromptService);
  }

  async ngOnInit() {
    this.organizations$ = this.organizationService.organizations$;
    await super.load();
  }

  async setCiphers() {
    const allCiphers = await this.getAllCiphers();
    this.findWeakPasswords(allCiphers);
  }

  protected findWeakPasswords(ciphers: any[]): void {
    ciphers.forEach((c) => {
      if (
        c.type !== CipherType.Login ||
        c.login.password == null ||
        c.login.password === "" ||
        c.isDeleted
      ) {
        return;
      }
      const hasUserName = this.isUserNameNotEmpty(c);
      const cacheKey = this.getCacheKey(c);
      if (!this.passwordStrengthCache.has(cacheKey)) {
        let userInput: string[] = [];
        if (hasUserName) {
          const atPosition = c.login.username.indexOf("@");
          if (atPosition > -1) {
            userInput = userInput
              .concat(
                c.login.username
                  .substr(0, atPosition)
                  .trim()
                  .toLowerCase()
                  .split(/[^A-Za-z0-9]/)
              )
              .filter((i) => i.length >= 3);
          } else {
            userInput = c.login.username
              .trim()
              .toLowerCase()
              .split(/[^A-Za-z0-9]/)
              .filter((i: any) => i.length >= 3);
          }
        }
        const result = this.passwordStrengthService.getPasswordStrength(
          c.login.password,
          null,
          userInput.length > 0 ? userInput : null
        );
        this.passwordStrengthCache.set(cacheKey, result.score);
      }
      const score = this.passwordStrengthCache.get(cacheKey);
      if (score != null && score <= 2) {
        this.passwordStrengthMap.set(c.id, this.scoreKey(score));
        this.weakPasswordCiphers.push(c);
      }
    });
    this.weakPasswordCiphers.sort((a, b) => {
      return (
        this.passwordStrengthCache.get(this.getCacheKey(a)) -
        this.passwordStrengthCache.get(this.getCacheKey(b))
      );
    });

    this.ciphers = this.weakPasswordCiphers.filter((c) => c.edit);
  }

  getAllCiphers(): Promise<CipherView[]> {
    return this.cipherService.getAllDecrypted();
  }

  protected canManageCipher(c: CipherView): boolean {
    // this will only ever be false from the org view;
    return true;
  }

  private isUserNameNotEmpty(c: CipherView): boolean {
    return !Utils.isNullOrWhitespace(c.login.username);
  }

  private getCacheKey(c: CipherView): string {
    return c.login.password + "_____" + (this.isUserNameNotEmpty(c) ? c.login.username : "");
  }

  private scoreKey(score: number): [string, BadgeTypes] {
    switch (score) {
      case 4:
        return ["strong", "success"];
      case 3:
        return ["good", "primary"];
      case 2:
        return ["weak", "warning"];
      default:
        return ["veryWeak", "danger"];
    }
  }
}
