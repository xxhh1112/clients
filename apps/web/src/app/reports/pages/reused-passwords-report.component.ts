import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription, Subject, takeUntil } from "rxjs";

import { ModalService } from "@bitwarden/angular/services/modal.service";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { PasswordRepromptService } from "@bitwarden/common/vault/abstractions/password-reprompt.service";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";

import { CipherReportComponent } from "./cipher-report.component";

@Component({
  selector: "app-reused-passwords-report",
  templateUrl: "reused-passwords-report.component.html",
})
export class ReusedPasswordsReportComponent
  extends CipherReportComponent
  implements OnInit, OnDestroy
{
  passwordUseMap: Map<string, number>;
  disabled = true;
  organizations: Organization[];
  private destroy$ = new Subject<void>();

  constructor(
    protected cipherService: CipherService,
    protected organizationService: OrganizationService,
    modalService: ModalService,
    messagingService: MessagingService,
    passwordRepromptService: PasswordRepromptService
  ) {
    super(modalService, messagingService, true, passwordRepromptService);
  }

  async ngOnInit() {
    this.subscribeToOrganizations();
    await super.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToOrganizations(): Subscription {
    return this.organizationService.organizations$
      .pipe(takeUntil(this.destroy$))
      .subscribe((orgs) => {
        this.organizations = orgs;
      });
  }

  async setCiphers() {
    const allCiphers = await this.getAllCiphers();
    const ciphersWithPasswords: CipherView[] = [];
    this.passwordUseMap = new Map<string, number>();
    allCiphers.forEach((c) => {
      if (
        c.type !== CipherType.Login ||
        c.login.password == null ||
        c.login.password === "" ||
        c.isDeleted
      ) {
        return;
      }
      ciphersWithPasswords.push(c);
      if (this.passwordUseMap.has(c.login.password)) {
        this.passwordUseMap.set(c.login.password, this.passwordUseMap.get(c.login.password) + 1);
      } else {
        this.passwordUseMap.set(c.login.password, 1);
      }
    });
    const reusedPasswordCiphers = ciphersWithPasswords.filter(
      (c) =>
        this.passwordUseMap.has(c.login.password) &&
        this.passwordUseMap.get(c.login.password) > 1 &&
        c.edit
    );
    this.ciphers = reusedPasswordCiphers;
  }

  protected getAllCiphers(): Promise<CipherView[]> {
    return this.cipherService.getAllDecrypted();
  }

  protected canManageCipher(c: CipherView): boolean {
    // this will only ever be false from an organization view
    return true;
  }
}
