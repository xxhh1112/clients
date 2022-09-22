import { Collection } from "@bitwarden/common/models/domain/collection";
import { CollectionView } from "@bitwarden/common/models/view/collectionView";

export class CollectionAdminService {
  getAllDecrypted: (organizationId: string) => Promise<CollectionView[]>;
  decryptMany: (collections: Collection[]) => Promise<CollectionView[]>;
  encrypt: (model: CollectionView) => Promise<Collection>;
}
