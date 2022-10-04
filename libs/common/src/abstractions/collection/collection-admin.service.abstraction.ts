import { CollectionAdminView } from "../../models/view/collection-admin-view";
import { CollectionView } from "../../models/view/collectionView";

export class CollectionAdminService {
  getAll: (organizationId: string) => Promise<CollectionView[]>;
  get: (organizationId: string, collectionId: string) => Promise<CollectionAdminView | undefined>;
  save: (collection: CollectionAdminView) => Promise<unknown>;
  remove: (organizationId: string, collectionId: string) => Promise<void>;
}
