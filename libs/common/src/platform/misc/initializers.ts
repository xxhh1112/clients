import { Constructor, Jsonify } from "type-fest";

/**
 * Higher-order helper function that allows for initializing an array of objects with a given initializer function.
 *
 * @param elementInitializer function called iteratively on each element of the array. The function should return the initialized element.
 * @returns
 */
export function initializeArray<T>(
  elementInitializer: (obj: Jsonify<T>) => T
): (objArray: Jsonify<T>[]) => T[] {
  return (objArray: Jsonify<T>[]) => objArray?.map(elementInitializer);
}

/**
 * Higher-order helper function that allows for initializing a record of objects with a given initializer function.
 *
 * @param entryInitializer
 * @returns
 */
export function initializeRecord<T>(
  entryInitializer: (obj: Jsonify<T>) => T
): (record: { [key: string]: Jsonify<T> }) => Record<string, T> {
  return (objRecord: { [key: string]: Jsonify<T> }) => {
    const record: Record<string, T> = {};
    for (const key in objRecord) {
      record[key] = entryInitializer(objRecord[key]);
    }
    return record;
  };
}

/**
 * Higher-order helper function that returns the given object as-is.
 */
export function noopInitialize<T>(jsonObj: Jsonify<T>): T {
  return jsonObj as T;
}

/**
 * Higher-order helper function that returns the given object as-is, but assigned to a prototype.
 *
 * @param constructor The constructor function of the class to be used as prototype.
 * @returns
 */
export function assignPrototype<T>(constructor: Constructor<T>): (obj: Jsonify<T>) => T {
  return (obj: Jsonify<T>) => Object.assign(Object.create(constructor.prototype), obj);
}
