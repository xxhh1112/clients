import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CollectionAdminService as CollectionAdminServiceAbstraction } from "@bitwarden/common/abstractions/collection/collection-admin.service.abstraction";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { EncString } from "@bitwarden/common/models/domain/encString";
import { CollectionRequest } from "@bitwarden/common/models/request/collectionRequest";
import { CollectionResponse } from "@bitwarden/common/models/response/collectionResponse";
import { CollectionAdminView } from "@bitwarden/common/models/view/collection-admin-view";

export class CollectionAdminService implements CollectionAdminServiceAbstraction {
  constructor(private apiService: ApiService, private cryptoService: CryptoService) {}

  async getAll(organizationId: string): Promise<CollectionAdminView[]> {
    const collectionResponse = await this.apiService.getCollections(organizationId);
    if (collectionResponse?.data == null || collectionResponse.data.length === 0) {
      return [];
    }

    return await this.decryptMany(organizationId, collectionResponse.data);
  }

  async save(collection: CollectionAdminView): Promise<unknown> {
    const request = await this.encrypt(collection);

    let response: CollectionResponse;
    if (collection.id == null) {
      response = await this.apiService.postCollection(collection.organizationId, request);
      collection.id = response.id;
    } else {
      response = await this.apiService.putCollection(
        collection.organizationId,
        collection.id,
        request
      );
    }

    // TODO: Implement upsert when in PS-1083: Collection Service refactors
    // await this.collectionService.upsert(data);
    return;
  }

  async remove(organizationId: string, collectionId: string): Promise<void> {
    await this.apiService.deleteCollection(organizationId, collectionId);
  }

  private async decryptMany(
    organizationId: string,
    collections: CollectionResponse[]
  ): Promise<CollectionAdminView[]> {
    const orgKey = await this.cryptoService.getOrgKey(organizationId);

    const promises = collections.map(async (c) => {
      const view = new CollectionAdminView();
      view.id = c.id;
      view.name = await this.cryptoService.decryptToUtf8(new EncString(c.name), orgKey);
      view.externalId = c.externalId;
      view.organizationId = c.organizationId;
      return view;
    });

    return await Promise.all(promises);
  }

  private async encrypt(model: CollectionAdminView): Promise<CollectionRequest> {
    if (model.organizationId == null) {
      throw new Error("Collection has no organization id.");
    }
    const key = await this.cryptoService.getOrgKey(model.organizationId);
    if (key == null) {
      throw new Error("No key for this collection's organization.");
    }
    const collection = new CollectionRequest();
    collection.externalId = model.externalId;
    collection.name = (await this.cryptoService.encrypt(model.name, key)).encryptedString;
    collection.groups = collection.groups.map((group) => ({
      id: group.id,
      hidePasswords: group.hidePasswords,
      readOnly: group.readOnly,
    }));
    return collection;
  }
}
