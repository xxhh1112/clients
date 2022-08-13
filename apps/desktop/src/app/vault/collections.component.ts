import { Component } from "@angular/core";

import { CollectionsComponent as BaseCollectionsComponent } from "@bitwarden/angular/components/collections.component";
import { CipherApiServiceAbstraction } from "@bitwarden/common/abstractions/cipher/cipher-api.service.abstraction";
import { CipherService } from "@bitwarden/common/abstractions/cipher/cipher.service.abstraction";
import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";

@Component({
  selector: "app-vault-collections",
  templateUrl: "collections.component.html",
})
export class CollectionsComponent extends BaseCollectionsComponent {
  constructor(
    cipherService: CipherService,
    i18nService: I18nService,
    collectionService: CollectionService,
    platformUtilsService: PlatformUtilsService,
    logService: LogService,
    cipherApiService: CipherApiServiceAbstraction
  ) {
    super(
      collectionService,
      platformUtilsService,
      i18nService,
      cipherService,
      logService,
      cipherApiService
    );
  }
}
