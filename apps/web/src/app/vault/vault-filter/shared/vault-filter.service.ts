import { Injectable } from "@angular/core";
import { of } from "rxjs";

import { VaultFilterService as BaseVaultFilterService } from "@bitwarden/angular/vault/vault-filter/services/vault-filter.service";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CipherService } from "@bitwarden/common/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { FolderService } from "@bitwarden/common/abstractions/folder/folder.service.abstraction";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { OrganizationService } from "@bitwarden/common/abstractions/organization.service";
import { PolicyService } from "@bitwarden/common/abstractions/policy/policy.service.abstraction";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { CollectionData } from "@bitwarden/common/models/data/collectionData";
import { Collection } from "@bitwarden/common/models/domain/collection";
import { Organization } from "@bitwarden/common/models/domain/organization";
import { CollectionDetailsResponse } from "@bitwarden/common/models/response/collectionResponse";
import { CollectionView } from "@bitwarden/common/models/view/collectionView";

@Injectable()
export class VaultFilterService extends BaseVaultFilterService {
  constructor(
    stateService: StateService,
    organizationService: OrganizationService,
    folderService: FolderService,
    cipherService: CipherService,
    collectionService: CollectionService,
    policyService: PolicyService,
    protected apiService: ApiService,
    i18nService: I18nService
  ) {
    super(
      stateService,
      organizationService,
      folderService,
      cipherService,
      collectionService,
      policyService,
      i18nService
    );
  }

  async buildCollections(org?: Organization) {
    let collections: CollectionView[] = [];
    // Build admin collections
    if (org?.permissions && org?.canEditAnyCollection) {
      const collectionResponse = await this.apiService.getCollections(org.id);
      if (collectionResponse?.data != null && collectionResponse.data.length) {
        const collectionDomains = collectionResponse.data.map(
          (r: CollectionDetailsResponse) => new Collection(new CollectionData(r))
        );
        collections = await this.collectionService.decryptMany(collectionDomains);
      }

      const noneCollection = new CollectionView();
      noneCollection.name = this.i18nService.t("unassigned");
      noneCollection.organizationId = org.id;
      collections.push(noneCollection);
    }
    // Build regular collections
    else {
      const storedCollections = await this.collectionService.getAllDecrypted();
      if (org?.id != null) {
        collections = storedCollections.filter((c) => c.organizationId === org.id);
      } else {
        collections = storedCollections;
      }
    }

    return of(await this.collectionService.getAllNested(collections));
  }
}
