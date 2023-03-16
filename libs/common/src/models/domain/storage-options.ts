import { Jsonify } from "type-fest";

import { HtmlStorageLocation } from "../../enums/htmlStorageLocation";
import { StorageLocation } from "../../types/storage";

export type StorageOptions = {
  storageLocation?: StorageLocation;
  useSecureStorage?: boolean;
  userId?: string;
  htmlStorageLocation?: HtmlStorageLocation;
  keySuffix?: string;
};

export type MemoryStorageOptions<T> = StorageOptions & { deserializer?: (obj: Jsonify<T>) => T };
