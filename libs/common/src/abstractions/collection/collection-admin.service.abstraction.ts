import { CollectionRequest } from "@bitwarden/common/models/request/collectionRequest";
import { CollectionResponse } from "@bitwarden/common/models/response/collectionResponse";
import { CollectionAdminView } from "@bitwarden/common/models/view/collection-admin-view";

export class CollectionAdminService {
  getAll: (organizationId: string) => Promise<CollectionAdminView[]>;
  decryptMany: (
    organizationId: string,
    collections: CollectionResponse[]
  ) => Promise<CollectionAdminView[]>;
  encrypt: (model: CollectionAdminView) => Promise<CollectionRequest>;
  save: (collection: CollectionAdminView) => Promise<unknown>;
}
