// eslint-disable-next-line import/no-restricted-paths -- Needed to print log messages
import { LogService } from "../abstractions/log.service";
// eslint-disable-next-line import/no-restricted-paths -- Needed to interface with storage locations
import { AbstractStorageService } from "../abstractions/storage.service";

export class MigrationHelper {
  constructor(
    public currentVersion: number,
    private storageService: AbstractStorageService,
    public logService: LogService
  ) {}

  get<T>(key: string): Promise<T> {
    return this.storageService.get<T>(key);
  }

  set<T>(key: string, value: T): Promise<void> {
    this.logService.info(`Setting ${key}`);
    return this.storageService.save(key, value);
  }

  info(message: string): void {
    this.logService.info(message);
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
