import { DeepJsonify } from "../../types/deep-jsonify";

export function arrayDeserializer<T>(
  deserializer: (jsonObj: DeepJsonify<T>) => T
): (jsonArray: DeepJsonify<T>[]) => T[] {
  return (jsonArray: DeepJsonify<T>[]) => jsonArray?.map(deserializer);
}
