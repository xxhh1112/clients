import { Component, OnInit } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { UserNamePipe } from "@bitwarden/angular/pipes/user-name.pipe";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { MessagingService } from "@bitwarden/common/abstractions/messaging.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { EmergencyAccessStatusType } from "@bitwarden/common/auth/enums/emergency-access-status-type";
import { EmergencyAccessType } from "@bitwarden/common/auth/enums/emergency-access-type";
import { EmergencyAccessConfirmRequest } from "@bitwarden/common/auth/models/request/emergency-access-confirm.request";
import {
  EmergencyAccessGranteeDetailsResponse,
  EmergencyAccessGrantorDetailsResponse,
} from "@bitwarden/common/auth/models/response/emergency-access.response";
import { Utils } from "@bitwarden/common/misc/utils";
import { DialogService } from "@bitwarden/components";

import { ConfirmData, ConfirmDialogComponent } from "./dialogs/confirm-dialog.component";
import {
  EmergencyAccessDialogComponent,
  EmergencyAccessDialogData,
  EmergencyAccessDialogResult,
} from "./dialogs/emergency-access-dialog.component";
import { TakeoverDialogComponent } from "./dialogs/takeover-dialog.component";
import { EmergencyAccessService } from "./emergency-access.service";

@Component({
  selector: "emergency-access",
  templateUrl: "emergency-access.component.html",
})
// eslint-disable-next-line rxjs-angular/prefer-takeuntil
export class EmergencyAccessComponent implements OnInit {
  loaded = false;
  canAccessPremium: boolean;
  trustedContacts: EmergencyAccessGranteeDetailsResponse[];
  grantedContacts: EmergencyAccessGrantorDetailsResponse[];
  emergencyAccessType = EmergencyAccessType;
  emergencyAccessStatusType = EmergencyAccessStatusType;
  actionPromise: Promise<any>;
  isOrganizationOwner: boolean;

  constructor(
    private apiService: ApiService,
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService,
    private cryptoService: CryptoService,
    private messagingService: MessagingService,
    private userNamePipe: UserNamePipe,
    private logService: LogService,
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
    this.trustedContacts = (await this.apiService.getEmergencyAccessTrusted()).data;
    this.grantedContacts = (await this.apiService.getEmergencyAccessGranted()).data;
    this.loaded = true;
  }

  async premiumRequired() {
    if (!this.canAccessPremium) {
      this.messagingService.send("premiumRequired");
      return;
    }
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
        this.load();
        break;
    }
  }

  invite() {
    this.edit(null);
  }

  async reinvite(contact: EmergencyAccessGranteeDetailsResponse) {
    if (this.actionPromise != null) {
      return;
    }
    this.actionPromise = this.apiService.postEmergencyAccessReinvite(contact.id);
    await this.actionPromise;
    this.platformUtilsService.showToast(
      "success",
      null,
      this.i18nService.t("hasBeenReinvited", contact.email)
    );
    this.actionPromise = null;
  }

  async confirm(contact: EmergencyAccessGranteeDetailsResponse) {
    function updateUser() {
      contact.status = EmergencyAccessStatusType.Confirmed;
    }

    if (this.actionPromise != null) {
      return;
    }

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

    this.actionPromise = this.doConfirmation(contact);
    await this.actionPromise;
    updateUser();

    this.platformUtilsService.showToast(
      "success",
      null,
      this.i18nService.t("hasBeenConfirmed", this.userNamePipe.transform(contact))
    );
    this.actionPromise = null;
  }

  async remove(
    details: EmergencyAccessGranteeDetailsResponse | EmergencyAccessGrantorDetailsResponse
  ) {
    const name = this.userNamePipe.transform(details);
    const deleted = await this.emergencyAccessService.delete(details.id, name);

    if (!deleted) {
      return;
    }

    await this.load();
  }

  async requestAccess(details: EmergencyAccessGrantorDetailsResponse) {
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
  }

  async approve(details: EmergencyAccessGranteeDetailsResponse) {
    const type = this.i18nService.t(
      details.type === EmergencyAccessType.View ? "view" : "takeover"
    );

    const confirmed = await this.platformUtilsService.showDialog(
      this.i18nService.t("approveAccessConfirmation", this.userNamePipe.transform(details), type),
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
  }

  async reject(details: EmergencyAccessGranteeDetailsResponse) {
    await this.apiService.postEmergencyAccessReject(details.id);
    details.status = EmergencyAccessStatusType.Confirmed;

    this.platformUtilsService.showToast(
      "success",
      null,
      this.i18nService.t("emergencyRejected", this.userNamePipe.transform(details))
    );
  }

  async takeover(details: EmergencyAccessGrantorDetailsResponse) {
    const dialogRef = this.dialogService.open(TakeoverDialogComponent, {});
    /*
    const [modal] = await this.modalService.openViewRef(
      EmergencyAccessTakeoverComponent,
      this.takeoverModalRef,
      (comp) => {
        comp.name = this.userNamePipe.transform(details);
        comp.email = details.email;
        comp.emergencyAccessId = details != null ? details.id : null;

        // eslint-disable-next-line rxjs-angular/prefer-takeuntil
        comp.onDone.subscribe(() => {
          modal.close();
          this.platformUtilsService.showToast(
            "success",
            null,
            this.i18nService.t("passwordResetFor", this.userNamePipe.transform(details))
          );
        });
      }
    );
    */
  }

  private removeGrantee(details: EmergencyAccessGranteeDetailsResponse) {
    const index = this.trustedContacts.indexOf(details);
    if (index > -1) {
      this.trustedContacts.splice(index, 1);
    }
  }

  private removeGrantor(details: EmergencyAccessGrantorDetailsResponse) {
    const index = this.grantedContacts.indexOf(details);
    if (index > -1) {
      this.grantedContacts.splice(index, 1);
    }
  }

  // Encrypt the master password hash using the grantees public key, and send it to bitwarden for escrow.
  private async doConfirmation(details: EmergencyAccessGranteeDetailsResponse) {
    const encKey = await this.cryptoService.getEncKey();
    const publicKeyResponse = await this.apiService.getUserPublicKey(details.granteeId);
    const publicKey = Utils.fromB64ToArray(publicKeyResponse.publicKey);

    try {
      this.logService.debug(
        "User's fingerprint: " +
          (await this.cryptoService.getFingerprint(details.granteeId, publicKey.buffer)).join("-")
      );
    } catch {
      // Ignore errors since it's just a debug message
    }

    const encryptedKey = await this.cryptoService.rsaEncrypt(encKey.key, publicKey.buffer);
    const request = new EmergencyAccessConfirmRequest();
    request.key = encryptedKey.encryptedString;
    await this.apiService.postEmergencyAccessConfirm(details.id, request);
  }
}
