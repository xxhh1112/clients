import { Component } from "@angular/core";

import { CipherAdminServiceAbstraction } from "@bitwarden/common/abstractions/cipher/cipher-admin.service.abstraction";
import { CipherAttachmentApiServiceAbstraction } from "@bitwarden/common/abstractions/cipher/cipher-attachment-api.service.abstraction";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { FileDownloadService } from "@bitwarden/common/abstractions/fileDownload/fileDownload.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { CipherData } from "@bitwarden/common/models/data/cipher.data";
import { Cipher } from "@bitwarden/common/models/domain/cipher";
import { Organization } from "@bitwarden/common/models/domain/organization";
import { AttachmentView } from "@bitwarden/common/models/view/attachment.view";

import { AttachmentsComponent as BaseAttachmentsComponent } from "../../vault/attachments.component";

@Component({
  selector: "app-org-vault-attachments",
  templateUrl: "../../vault/attachments.component.html",
})
export class AttachmentsComponent extends BaseAttachmentsComponent {
  viewOnly = false;
  organization: Organization;

  constructor(
    cipherAttachmentApiService: CipherAttachmentApiServiceAbstraction,
    i18nService: I18nService,
    cryptoService: CryptoService,
    stateService: StateService,
    platformUtilsService: PlatformUtilsService,
    logService: LogService,
    fileDownloadService: FileDownloadService,
    private cipherAdminService: CipherAdminServiceAbstraction
  ) {
    super(
      cipherAttachmentApiService,
      i18nService,
      cryptoService,
      stateService,
      platformUtilsService,
      logService,
      fileDownloadService
    );
  }

  protected async reupload(attachment: AttachmentView) {
    if (this.organization.canEditAnyCollection && this.showFixOldAttachments(attachment)) {
      await super.reuploadCipherAttachment(attachment, true);
    }
  }

  protected async loadCipher() {
    if (!this.organization.canEditAnyCollection) {
      return this.cipherDomain;
    }
    const response = await this.cipherAdminService.getCipherAdmin(this.cipherDomain.id);
    return new Cipher(new CipherData(response));
  }

  protected saveCipherAttachment(file: File) {
    return this.cipherAttachmentApiService.saveAttachmentWithServer(
      this.cipherDomain,
      file,
      this.organization.canEditAnyCollection
    );
  }

  protected deleteCipherAttachment(attachmentId: string) {
    if (!this.organization.canEditAnyCollection) {
      return super.deleteCipherAttachment(attachmentId);
    }
    return this.cipherAttachmentApiService.deleteCipherAttachmentAdmin(
      this.cipherDomain.id,
      attachmentId
    );
  }

  protected showFixOldAttachments(attachment: AttachmentView) {
    return attachment.key == null && this.organization.canEditAnyCollection;
  }
}
