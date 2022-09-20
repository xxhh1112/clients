import { Component } from "@angular/core";

import { AttachmentsComponent as BaseAttachmentsComponent } from "@bitwarden/angular/components/attachments.component";
import { CipherAttachmentApiServiceAbstraction } from "@bitwarden/common/abstractions/cipher/cipher-attachment-api.service.abstraction";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { FileDownloadService } from "@bitwarden/common/abstractions/fileDownload/fileDownload.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";

@Component({
  selector: "app-vault-attachments",
  templateUrl: "attachments.component.html",
})
export class AttachmentsComponent extends BaseAttachmentsComponent {
  constructor(
    cipherAttachmentApiService: CipherAttachmentApiServiceAbstraction,
    i18nService: I18nService,
    cryptoService: CryptoService,
    platformUtilsService: PlatformUtilsService,
    logService: LogService,
    stateService: StateService,
    fileDownloadService: FileDownloadService
  ) {
    super(
      cipherAttachmentApiService,
      i18nService,
      cryptoService,
      platformUtilsService,
      window,
      logService,
      stateService,
      fileDownloadService
    );
  }
}
