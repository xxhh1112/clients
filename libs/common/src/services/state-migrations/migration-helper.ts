import { Jsonify } from "type-fest";

export class MigrationHelper {
  constructor(public currentVersion: number) {}

  async get<T>(key: string): Promise<Jsonify<T>> {
    throw new Error("Not implemented");
  }

  set<T>(key: string, value: T): Promise<void> {
    throw new Error("Not implemented");
  }
}
