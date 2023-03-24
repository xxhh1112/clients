import { Guid } from "../types/guid";
import { StorageKey } from "../types/storage";

/** Standard function for creating persistent storage keys.
 * Any changes to the output of this function for any given input will require migrations
 * @param scope Either global or scoped to a given account guid
 * @param serviceKey The name of the service that will be using the key
 * @param itemKey The identifier used within scope */
export function storageKey(
  scope: "global" | ["account", Guid],
  serviceKey: string,
  itemKey: string
): StorageKey {
  if (scope === "global") {
    return `global.${serviceKey}.${itemKey}` as StorageKey;
  } else {
    return `${scope[0]}.${scope[1]}.${serviceKey}.${itemKey}` as StorageKey;
  }
}
