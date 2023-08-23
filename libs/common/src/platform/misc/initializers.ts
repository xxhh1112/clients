import { Constructor, Jsonify } from "type-fest";

export function arrayInitialize<T>(
  initializer: (obj: Jsonify<T>) => T
): (objArray: Jsonify<T>[]) => T[] {
  return (objArray: Jsonify<T>[]) => objArray?.map(initializer);
}

export function recordInitialize<T>(
  initializer: (obj: Jsonify<T>) => T
): (record: { [key: string]: Jsonify<T> }) => Record<string, T> {
  return (objRecord: { [key: string]: Jsonify<T> }) => {
    const record: Record<string, T> = {};
    for (const key in objRecord) {
      record[key] = initializer(objRecord[key]);
    }
    return record;
  };
}

export function noopInitialize<T>(jsonObj: Jsonify<T>): T {
  return jsonObj as T;
}

export function assignPrototype<T>(constructor: Constructor<T>): (obj: Jsonify<T>) => T {
  return (obj: Jsonify<T>) => Object.assign(Object.create(constructor.prototype), obj);
}
