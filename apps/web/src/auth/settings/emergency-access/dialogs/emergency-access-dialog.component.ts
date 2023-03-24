import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, Input, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { EmergencyAccessType } from "@bitwarden/common/auth/enums/emergency-access-type";
import { EmergencyAccessInviteRequest } from "@bitwarden/common/auth/models/request/emergency-access-invite.request";
import { EmergencyAccessUpdateRequest } from "@bitwarden/common/auth/models/request/emergency-access-update.request";

import { EmergencyAccessService } from "../emergency-access.service";

export type EmergencyAccessDialogData = {
  name: string;
  emergencyAccessId: string;
  readOnly: boolean;
};

export enum EmergencyAccessDialogResult {
  Close,
  Save,
  Delete,
}

@Component({
  templateUrl: "emergency-access-dialog.component.html",
})
export class EmergencyAccessDialogComponent implements OnInit {
  @Input() name: string;
  @Input() id: string;

  loading = true;
  readOnly = false;
  editMode = false;

  protected emergencyAccessType = EmergencyAccessType;
  protected waitTimes: { name: string; value: number }[];

  formGroup = this.formBuilder.group({
    email: ["", [Validators.required]],
    type: [EmergencyAccessType.View, [Validators.required]],
    waitTime: [7, [Validators.required]],
  });

  constructor(
    @Inject(DIALOG_DATA) private data: EmergencyAccessDialogData,
    private dialogRef: DialogRef<EmergencyAccessDialogResult>,
    private apiService: ApiService,
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService,
    private logService: LogService,
    private formBuilder: FormBuilder,
    private emergencyAccessService: EmergencyAccessService
  ) {}

  async ngOnInit() {
    this.id = this.data.emergencyAccessId;
    this.name = this.data.name;
    this.readOnly = this.data.readOnly;

    this.editMode = this.loading = this.id != null;

    this.waitTimes = [
      { name: this.i18nService.t("oneDay"), value: 1 },
      { name: this.i18nService.t("days", "2"), value: 2 },
      { name: this.i18nService.t("days", "7"), value: 7 },
      { name: this.i18nService.t("days", "14"), value: 14 },
      { name: this.i18nService.t("days", "30"), value: 30 },
      { name: this.i18nService.t("days", "90"), value: 90 },
    ];

    if (this.editMode) {
      try {
        const emergencyAccess = await this.apiService.getEmergencyAccess(this.id);

        this.formGroup.patchValue({
          type: emergencyAccess.type,
          waitTime: emergencyAccess.waitTimeDays,
        });
      } catch (e) {
        this.logService.error(e);
      }
    }

    this.loading = false;
  }

  submit = async () => {
    const data = this.formGroup.value;

    if (this.editMode) {
      const request = new EmergencyAccessUpdateRequest();
      request.type = data.type;
      request.waitTimeDays = data.waitTime;

      await this.apiService.putEmergencyAccess(this.id, request);
    } else {
      const request = new EmergencyAccessInviteRequest();
      request.email = data.email;
      request.type = data.type;
      request.waitTimeDays = data.waitTime;

      await this.apiService.postEmergencyAccessInvite(request);
    }

    this.platformUtilsService.showToast(
      "success",
      null,
      this.i18nService.t(this.editMode ? "editedUserId" : "invitedUsers", this.name)
    );

    this.dialogRef.close(EmergencyAccessDialogResult.Save);
  };

  delete = async () => {
    const deleted = await this.emergencyAccessService.delete(this.id, this.name);

    if (!deleted) {
      return;
    }

    this.dialogRef.close(EmergencyAccessDialogResult.Delete);
  };
}
