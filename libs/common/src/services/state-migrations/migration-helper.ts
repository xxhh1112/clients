import { AbstractStorageService } from "../../abstractions/storage.service";

export class MigrationHelper {
  constructor(public currentVersion: number, private storageService: AbstractStorageService) {}

  get<T>(key: string): Promise<T> {
    return this.storageService.get<T>(key);
  }

  set<T>(key: string, value: T): Promise<void> {
    return this.storageService.save(key, value);
  }
}
