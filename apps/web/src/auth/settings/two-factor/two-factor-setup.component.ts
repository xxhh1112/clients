import { ComponentType } from "@angular/cdk/overlay";
import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Type,
  ViewChild,
  ViewContainerRef,
} from "@angular/core";
import { firstValueFrom, Subject, takeUntil } from "rxjs";

import { ModalRef } from "@bitwarden/angular/components/modal/modal.ref";
import { ModalService } from "@bitwarden/angular/services/modal.service";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { MessagingService } from "@bitwarden/common/abstractions/messaging.service";
import { PolicyService } from "@bitwarden/common/abstractions/policy/policy.service.abstraction";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { TwoFactorProviderType } from "@bitwarden/common/auth/enums/two-factor-provider-type";
import { TwoFactorProviders } from "@bitwarden/common/auth/services/two-factor.service";
import { PolicyType } from "@bitwarden/common/enums/policyType";
import { DialogService } from "@bitwarden/components";

import { AuthenticatorDialogComponent } from "./two-factor-authenticator.component";
import { TwoFactorDuoComponent } from "./two-factor-duo.component";
import { EmailDialogComponent } from "./two-factor-email.component";
import { TwoFactorRecoveryComponent } from "./two-factor-recovery.component";
import { TwoFactorWebAuthnComponent } from "./two-factor-webauthn.component";
import { TwoFactorYubiKeyComponent } from "./two-factor-yubikey.component";

@Component({
  selector: "app-two-factor-setup",
  templateUrl: "two-factor-setup.component.html",
})
export class TwoFactorSetupComponent implements OnInit, OnDestroy {
  @ViewChild("recoveryTemplate", { read: ViewContainerRef, static: true })
  recoveryModalRef: ViewContainerRef;
  @ViewChild("yubikeyTemplate", { read: ViewContainerRef, static: true })
  yubikeyModalRef: ViewContainerRef;
  @ViewChild("duoTemplate", { read: ViewContainerRef, static: true }) duoModalRef: ViewContainerRef;
  @ViewChild("webAuthnTemplate", { read: ViewContainerRef, static: true })
  webAuthnModalRef: ViewContainerRef;

  organizationId: string;
  providers: any[] = [];
  canAccessPremium: boolean;
  showPolicyWarning = false;
  loading = true;
  modal: ModalRef;
  formPromise: Promise<any>;

  tabbedHeader = true;

  private destroy$ = new Subject<void>();
  private twoFactorAuthPolicyAppliesToActiveUser: boolean;

  constructor(
    protected apiService: ApiService,
    protected modalService: ModalService,
    protected messagingService: MessagingService,
    protected policyService: PolicyService,
    private stateService: StateService,
    private dialogService: DialogService
  ) {}

  async ngOnInit() {
    this.canAccessPremium = await this.stateService.getCanAccessPremium();

    for (const key in TwoFactorProviders) {
      // eslint-disable-next-line
      if (!TwoFactorProviders.hasOwnProperty(key)) {
        continue;
      }

      const p = (TwoFactorProviders as any)[key];
      if (this.filterProvider(p.type)) {
        continue;
      }

      this.providers.push({
        type: p.type,
        name: p.name,
        description: p.description,
        enabled: false,
        premium: p.premium,
        sort: p.sort,
      });
    }

    this.providers.sort((a: any, b: any) => a.sort - b.sort);

    this.policyService
      .policyAppliesToActiveUser$(PolicyType.TwoFactorAuthentication)
      .pipe(takeUntil(this.destroy$))
      .subscribe((policyAppliesToActiveUser) => {
        this.twoFactorAuthPolicyAppliesToActiveUser = policyAppliesToActiveUser;
      });

    await this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async load() {
    this.loading = true;
    const providerList = await this.getTwoFactorProviders();
    providerList.data.forEach((p) => {
      this.providers.forEach((p2) => {
        if (p.type === p2.type) {
          p2.enabled = p.enabled;
        }
      });
    });
    this.evaluatePolicies();
    this.loading = false;
  }

  async manage(type: TwoFactorProviderType) {
    switch (type) {
      case TwoFactorProviderType.Authenticator: {
        this.openDialogAndSubscribeUpdate(
          AuthenticatorDialogComponent,
          TwoFactorProviderType.Authenticator
        );
        break;
      }
      case TwoFactorProviderType.Yubikey: {
        const yubiComp = await this.openModal(this.yubikeyModalRef, TwoFactorYubiKeyComponent);
        // eslint-disable-next-line rxjs-angular/prefer-takeuntil
        yubiComp.onUpdated.subscribe((enabled: boolean) => {
          this.updateStatus(enabled, TwoFactorProviderType.Yubikey);
        });
        break;
      }
      case TwoFactorProviderType.Duo: {
        const duoComp = await this.openModal(this.duoModalRef, TwoFactorDuoComponent);
        // eslint-disable-next-line rxjs-angular/prefer-takeuntil
        duoComp.onUpdated.subscribe((enabled: boolean) => {
          this.updateStatus(enabled, TwoFactorProviderType.Duo);
        });
        break;
      }
      case TwoFactorProviderType.Email: {
        this.openDialogAndSubscribeUpdate(EmailDialogComponent, TwoFactorProviderType.Email);
        break;
      }
      case TwoFactorProviderType.WebAuthn: {
        const webAuthnComp = await this.openModal(
          this.webAuthnModalRef,
          TwoFactorWebAuthnComponent
        );
        // eslint-disable-next-line rxjs-angular/prefer-takeuntil
        webAuthnComp.onUpdated.subscribe((enabled: boolean) => {
          this.updateStatus(enabled, TwoFactorProviderType.WebAuthn);
        });
        break;
      }
      default:
        break;
    }
  }

  private openDialogAndSubscribeUpdate<C = unknown>(
    type: ComponentType<C>,
    providerType: TwoFactorProviderType
  ) {
    const eventEmitter = new EventEmitter<boolean>();
    const dialogRef = this.dialogService.open(type, {
      data: { updated: eventEmitter },
    });

    eventEmitter.pipe(takeUntil(this.destroy$)).subscribe((enabled: boolean) => {
      this.updateStatus(enabled, providerType);
    });

    firstValueFrom(dialogRef.closed).then(() => {
      eventEmitter.complete();
    });
  }

  recoveryCode() {
    this.openModal(this.recoveryModalRef, TwoFactorRecoveryComponent);
  }

  async premiumRequired() {
    if (!this.canAccessPremium) {
      this.messagingService.send("premiumRequired");
      return;
    }
  }

  protected getTwoFactorProviders() {
    return this.apiService.getTwoFactorProviders();
  }

  protected filterProvider(type: TwoFactorProviderType) {
    return type === TwoFactorProviderType.OrganizationDuo;
  }

  protected async openModal<T>(ref: ViewContainerRef, type: Type<T>): Promise<T> {
    const [modal, childComponent] = await this.modalService.openViewRef(type, ref);
    this.modal = modal;

    return childComponent;
  }

  protected updateStatus(enabled: boolean, type: TwoFactorProviderType) {
    if (!enabled && this.modal != null) {
      this.modal.close();
    }
    this.providers.forEach((p) => {
      if (p.type === type) {
        p.enabled = enabled;
      }
    });
    this.evaluatePolicies();
  }

  private async evaluatePolicies() {
    if (this.organizationId == null && this.providers.filter((p) => p.enabled).length === 1) {
      this.showPolicyWarning = this.twoFactorAuthPolicyAppliesToActiveUser;
    } else {
      this.showPolicyWarning = false;
    }
  }
}
