import { Collection } from "@bitwarden/common/models/domain/collection";

export class CollectionApiService {
  save: (collection: Collection) => Promise<unknown>;
}
