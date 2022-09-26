import { CollectionAdminView } from "@bitwarden/common/models/view/collection-admin-view";

export class CollectionAdminService {
  getAll: (organizationId: string) => Promise<CollectionAdminView[]>;
  save: (collection: CollectionAdminView) => Promise<unknown>;
  remove: (organizationId: string, collectionId: string) => Promise<void>;
}
