import { AbstractStorageService } from "../abstractions/storage.service";

export class MigrationHelper {
  constructor(public currentVersion: number, private storageService: AbstractStorageService) {}

  get<T>(key: string): Promise<T> {
    return this.storageService.get<T>(key);
  }

  set<T>(key: string, value: T): Promise<void> {
    return this.storageService.save(key, value);
  }

  async getAccounts<ExpectedAccountType>(): Promise<
    { id: string; account: ExpectedAccountType }[]
  > {
    const userIds = (await this.get<string[]>("authenticatedAccounts")) ?? [];
    return Promise.all(
      userIds.map(async (id) => ({ id, account: await this.get<ExpectedAccountType>(id) }))
    );
  }
}
