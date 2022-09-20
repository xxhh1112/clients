import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { CollectionApiService as CollectionApiServiceAbstraction } from "@bitwarden/common/abstractions/collection/collection-api.service.abstraction";
import { Collection } from "@bitwarden/common/models/domain/collection";
import { CollectionRequest } from "@bitwarden/common/models/request/collectionRequest";
import { CollectionResponse } from "@bitwarden/common/models/response/collectionResponse";

export class CollectionApiService implements CollectionApiServiceAbstraction {
  constructor(private collectionService: CollectionService, private apiService: ApiService) {}

  async save(collection: Collection): Promise<unknown> {
    const request = new CollectionRequest(collection);

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
}
