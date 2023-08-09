import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription, Subject, takeUntil } from "rxjs";

import { ModalService } from "@bitwarden/angular/services/modal.service";
import { AuditService } from "@bitwarden/common/abstractions/audit.service";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { PasswordRepromptService } from "@bitwarden/common/vault/abstractions/password-reprompt.service";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";

import { CipherReportComponent } from "./cipher-report.component";


@Component({
  selector: "app-exposed-passwords-report",
  templateUrl: "exposed-passwords-report.component.html",
})
export class ExposedPasswordsReportComponent
  extends CipherReportComponent
  implements OnInit, OnDestroy
{
  exposedPasswordMap = new Map<string, number>();
  disabled = true;
  private destroy$ = new Subject<void>();
  organizations: Organization[];

  constructor(
    protected cipherService: CipherService,
    protected auditService: AuditService,
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

  subscribeToOrganizations(): Subscription {
    return this.organizationService.organizations$
      .pipe(takeUntil(this.destroy$))
      .subscribe((orgs) => {
        this.organizations = orgs;
      });
  }

  async setCiphers() {
    const allCiphers = await this.getAllCiphers();
    const exposedPasswordCiphers: CipherView[] = [];
    const promises: Promise<void>[] = [];
    allCiphers.forEach((c) => {
      if (
        c.type !== CipherType.Login ||
        c.login.password == null ||
        c.login.password === "" ||
        c.isDeleted
      ) {
        return;
      }
      const promise = this.auditService.passwordLeaked(c.login.password).then((exposedCount) => {
        if (exposedCount > 0) {
          exposedPasswordCiphers.push(c);
          this.exposedPasswordMap.set(c.id, exposedCount);
        }
      });
      promises.push(promise);
    });
    await Promise.all(promises);
    this.ciphers = exposedPasswordCiphers.filter((c) => c.edit);
  }

  getAllCiphers(): Promise<CipherView[]> {
    return this.cipherService.getAllDecrypted();
  }

  protected canManageCipher(c: CipherView): boolean {
    // this will only ever be false from the org view;
    return true;
  }
}
