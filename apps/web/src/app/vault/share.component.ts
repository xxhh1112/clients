import { Component, OnDestroy } from "@angular/core";

import { ShareComponent as BaseShareComponent } from "@bitwarden/angular/components/share.component";
import { CipherApiAttachmentServiceAbstraction } from "@bitwarden/common/abstractions/cipher/cipher-api-attachment.service.abstraction";
import { CipherService } from "@bitwarden/common/abstractions/cipher/cipher.service.abstraction";
import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { OrganizationService } from "@bitwarden/common/abstractions/organization.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { CollectionView } from "@bitwarden/common/models/view/collectionView";

@Component({
  selector: "app-vault-share",
  templateUrl: "share.component.html",
})
export class ShareComponent extends BaseShareComponent implements OnDestroy {
  constructor(
    collectionService: CollectionService,
    platformUtilsService: PlatformUtilsService,
    i18nService: I18nService,
    cipherService: CipherService,
    organizationService: OrganizationService,
    logService: LogService,
    cipherApiAttachmentService: CipherApiAttachmentServiceAbstraction
  ) {
    super(
      collectionService,
      platformUtilsService,
      i18nService,
      cipherService,
      logService,
      organizationService,
      cipherApiAttachmentService
    );
  }

  ngOnDestroy() {
    this.selectAll(false);
  }

  check(c: CollectionView, select?: boolean) {
    (c as any).checked = select == null ? !(c as any).checked : select;
  }

  selectAll(select: boolean) {
    const collections = select ? this.collections : this.writeableCollections;
    collections.forEach((c) => this.check(c, select));
  }
}
