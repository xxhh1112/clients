import { Component } from "@angular/core";

import { CipherApiAdminServiceAbstraction } from "@bitwarden/common/abstractions/cipher/cipher-api-admin.service.abstraction";
import { CipherService } from "@bitwarden/common/abstractions/cipher/cipher.service.abstraction";
import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { CipherData } from "@bitwarden/common/models/data/cipherData";
import { Cipher } from "@bitwarden/common/models/domain/cipher";
import { Organization } from "@bitwarden/common/models/domain/organization";
import { CipherCollectionsRequest } from "@bitwarden/common/models/request/cipherCollectionsRequest";

import { CollectionsComponent as BaseCollectionsComponent } from "../../vault/collections.component";

@Component({
  selector: "app-org-vault-collections",
  templateUrl: "../../vault/collections.component.html",
})
export class CollectionsComponent extends BaseCollectionsComponent {
  organization: Organization;

  constructor(
    collectionService: CollectionService,
    platformUtilsService: PlatformUtilsService,
    i18nService: I18nService,
    cipherService: CipherService,
    private cipherApiAdminService: CipherApiAdminServiceAbstraction,
    logService: LogService
  ) {
    super(collectionService, platformUtilsService, i18nService, cipherService, logService);
    this.allowSelectNone = true;
  }

  protected async loadCipher() {
    if (!this.organization.canViewAllCollections) {
      return await super.loadCipher();
    }
    const response = await this.cipherApiAdminService.getCipherAdmin(this.cipherId);
    return new Cipher(new CipherData(response));
  }

  protected loadCipherCollections() {
    if (!this.organization.canViewAllCollections) {
      return super.loadCipherCollections();
    }
    return this.collectionIds;
  }

  protected loadCollections() {
    if (!this.organization.canViewAllCollections) {
      return super.loadCollections();
    }
    return Promise.resolve(this.collections);
  }

  protected saveCollections() {
    if (this.organization.canEditAnyCollection) {
      const request = new CipherCollectionsRequest(this.cipherDomain.collectionIds);
      return this.cipherApiAdminService.putCipherCollectionsAdmin(this.cipherId, request);
    } else {
      return super.saveCollections();
    }
  }
}
