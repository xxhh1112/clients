import { Component, EventEmitter, Input, Output } from "@angular/core";

import { CipherApiAdminServiceAbstraction } from "@bitwarden/common/abstractions/cipher/cipher-api-admin.service.abstraction";
import { CipherApiServiceAbstraction } from "@bitwarden/common/abstractions/cipher/cipher-api.service.abstraction";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { Organization } from "@bitwarden/common/models/domain/organization";
import { CipherBulkDeleteRequest } from "@bitwarden/common/models/request/cipherBulkDeleteRequest";

@Component({
  selector: "app-vault-bulk-delete",
  templateUrl: "bulk-delete.component.html",
})
export class BulkDeleteComponent {
  @Input() cipherIds: string[] = [];
  @Input() permanent = false;
  @Input() organization: Organization;
  @Output() onDeleted = new EventEmitter();

  formPromise: Promise<any>;

  constructor(
    private cipherApiService: CipherApiServiceAbstraction,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService,
    private cipherApiAdminService: CipherApiAdminServiceAbstraction
  ) {}

  async submit() {
    if (!this.organization || !this.organization.canEditAnyCollection) {
      await this.deleteCiphers();
    } else {
      await this.deleteCiphersAdmin();
    }

    await this.formPromise;

    this.onDeleted.emit();
    this.platformUtilsService.showToast(
      "success",
      null,
      this.i18nService.t(this.permanent ? "permanentlyDeletedItems" : "deletedItems")
    );
  }

  private async deleteCiphers() {
    if (this.permanent) {
      this.formPromise = await this.cipherApiService.deleteManyWithServer(this.cipherIds);
    } else {
      this.formPromise = await this.cipherApiService.softDeleteManyWithServer(this.cipherIds);
    }
  }

  private async deleteCiphersAdmin() {
    const deleteRequest = new CipherBulkDeleteRequest(this.cipherIds, this.organization.id);
    if (this.permanent) {
      this.formPromise = await this.cipherApiAdminService.deleteManyCiphersAdmin(deleteRequest);
    } else {
      this.formPromise = await this.cipherApiAdminService.putDeleteManyCiphersAdmin(deleteRequest);
    }
  }
}
