import { Component, OnInit } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { UserNamePipe } from "@bitwarden/angular/pipes/user-name.pipe";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { EmergencyAccessStatusType } from "@bitwarden/common/auth/enums/emergency-access-status-type";
import { EmergencyAccessType } from "@bitwarden/common/auth/enums/emergency-access-type";
import {
  EmergencyAccessGranteeDetailsResponse,
  EmergencyAccessGrantorDetailsResponse,
} from "@bitwarden/common/auth/models/response/emergency-access.response";
import { DialogService } from "@bitwarden/components";

import { ConfirmData, ConfirmDialogComponent } from "./dialogs/confirm-dialog.component";
import {
  EmergencyAccessDialogComponent,
  EmergencyAccessDialogData,
  EmergencyAccessDialogResult,
} from "./dialogs/emergency-access-dialog.component";
import { TakeoverData, TakeoverDialogComponent } from "./dialogs/takeover-dialog.component";
import { EmergencyAccessService } from "./emergency-access.service";

@Component({
  selector: "emergency-access",
  templateUrl: "emergency-access.component.html",
})
// eslint-disable-next-line rxjs-angular/prefer-takeuntil
export class EmergencyAccessComponent implements OnInit {
  protected disabled = false;
  protected loaded = false;

  protected grantedContacts: EmergencyAccessGrantorDetailsResponse[];
  protected trustedContacts: EmergencyAccessGranteeDetailsResponse[];

  protected emergencyAccessStatusType = EmergencyAccessStatusType;
  protected emergencyAccessType = EmergencyAccessType;
  protected canAccessPremium: boolean;
  protected isOrganizationOwner: boolean;

  constructor(
    private apiService: ApiService,
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService,
    private userNamePipe: UserNamePipe,
    private stateService: StateService,
    private organizationService: OrganizationService,
    private dialogService: DialogService,
    private emergencyAccessService: EmergencyAccessService
  ) {}

  async ngOnInit() {
    this.canAccessPremium = await this.stateService.getCanAccessPremium();
    const orgs = await this.organizationService.getAll();
    this.isOrganizationOwner = orgs.some((o) => o.isOwner);

    this.load();
  }

  async load() {
    this.loaded = false;
    this.trustedContacts = (await this.apiService.getEmergencyAccessTrusted()).data;
    this.grantedContacts = (await this.apiService.getEmergencyAccessGranted()).data;
    this.loaded = true;
  }

  async edit(details: EmergencyAccessGranteeDetailsResponse) {
    const dialogRef = this.dialogService.open<
      EmergencyAccessDialogResult,
      EmergencyAccessDialogData
    >(EmergencyAccessDialogComponent, {
      data: {
        name: this.userNamePipe.transform(details),
        emergencyAccessId: details?.id,
        readOnly: !this.canAccessPremium,
      },
    });

    const result = await firstValueFrom(dialogRef.closed);

    switch (result) {
      case EmergencyAccessDialogResult.Close:
        break;
      case EmergencyAccessDialogResult.Save:
      case EmergencyAccessDialogResult.Delete:
        await this.setDisabledWhileRunning(this.load());
        break;
    }
  }

  invite() {
    this.edit(null);
  }

  async reinvite(contact: EmergencyAccessGranteeDetailsResponse) {
    await this.setDisabledWhileRunning(this.apiService.postEmergencyAccessReinvite(contact.id));

    this.platformUtilsService.showToast(
      "success",
      null,
      this.i18nService.t("hasBeenReinvited", contact.email)
    );
  }

  async confirm(contact: EmergencyAccessGranteeDetailsResponse) {
    await this.setDisabledWhileRunning(
      (async () => {
        const autoConfirm = await this.stateService.getAutoConfirmFingerPrints();
        if (autoConfirm == null || !autoConfirm) {
          const dialogRef = this.dialogService.open<unknown, ConfirmData>(ConfirmDialogComponent, {
            data: {
              name: this.userNamePipe.transform(contact),
              userId: contact?.granteeId,
              emergencyAccessId: contact.id,
            },
          });

          const result = await firstValueFrom(dialogRef.closed);

          if (!result) {
            return;
          }
        }

        await this.emergencyAccessService.confirmUser(contact);

        contact.status = EmergencyAccessStatusType.Confirmed;

        this.platformUtilsService.showToast(
          "success",
          null,
          this.i18nService.t("hasBeenConfirmed", this.userNamePipe.transform(contact))
        );
      })()
    );
  }

  async remove(
    details: EmergencyAccessGranteeDetailsResponse | EmergencyAccessGrantorDetailsResponse
  ) {
    await this.setDisabledWhileRunning(
      (async () => {
        const name = this.userNamePipe.transform(details);
        const deleted = await this.emergencyAccessService.delete(details.id, name);

        if (!deleted) {
          return;
        }

        await this.load();
      })()
    );
  }

  async requestAccess(details: EmergencyAccessGrantorDetailsResponse) {
    await this.setDisabledWhileRunning(
      (async () => {
        const confirmed = await this.platformUtilsService.showDialog(
          this.i18nService.t("requestAccessConfirmation", details.waitTimeDays.toString()),
          this.userNamePipe.transform(details),
          this.i18nService.t("requestAccess"),
          this.i18nService.t("no"),
          "warning"
        );

        if (!confirmed) {
          return false;
        }

        await this.apiService.postEmergencyAccessInitiate(details.id);

        details.status = EmergencyAccessStatusType.RecoveryInitiated;
        this.platformUtilsService.showToast(
          "success",
          null,
          this.i18nService.t("requestSent", this.userNamePipe.transform(details))
        );
      })()
    );
  }

  async approve(details: EmergencyAccessGranteeDetailsResponse) {
    await this.setDisabledWhileRunning(
      (async () => {
        const type = this.i18nService.t(
          details.type === EmergencyAccessType.View ? "view" : "takeover"
        );

        const confirmed = await this.platformUtilsService.showDialog(
          this.i18nService.t(
            "approveAccessConfirmation",
            this.userNamePipe.transform(details),
            type
          ),
          this.userNamePipe.transform(details),
          this.i18nService.t("approve"),
          this.i18nService.t("no"),
          "warning"
        );

        if (!confirmed) {
          return false;
        }

        await this.apiService.postEmergencyAccessApprove(details.id);
        details.status = EmergencyAccessStatusType.RecoveryApproved;

        this.platformUtilsService.showToast(
          "success",
          null,
          this.i18nService.t("emergencyApproved", this.userNamePipe.transform(details))
        );
      })()
    );
  }

  async reject(details: EmergencyAccessGranteeDetailsResponse) {
    await this.setDisabledWhileRunning(this.apiService.postEmergencyAccessReject(details.id));
    details.status = EmergencyAccessStatusType.Confirmed;

    this.platformUtilsService.showToast(
      "success",
      null,
      this.i18nService.t("emergencyRejected", this.userNamePipe.transform(details))
    );
  }

  async takeover(details: EmergencyAccessGrantorDetailsResponse) {
    this.dialogService.open<unknown, TakeoverData>(TakeoverDialogComponent, {
      data: {
        id: details?.id,
        name: this.userNamePipe.transform(details),
        email: details.email,
      },
    });
  }

  /**
   * Helper methods that sets disabled while the input promise is pending.
   */
  private async setDisabledWhileRunning<T>(fn: Promise<T>): Promise<T> {
    this.disabled = true;

    try {
      return await fn;
    } finally {
      this.disabled = false;
    }
  }
}
