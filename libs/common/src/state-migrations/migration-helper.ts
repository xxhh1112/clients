// eslint-disable-next-line import/no-restricted-paths -- Needed to print log messages
import { LogService } from "../abstractions/log.service";
// eslint-disable-next-line import/no-restricted-paths -- Needed to interface with storage locations
import { AbstractStorageService } from "../abstractions/storage.service";
// eslint-disable-next-line import/no-restricted-paths -- Type interface to ensure Guids are used
import { Guid } from "../types/guid";

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

  remove(key: string): Promise<void> {
    this.logService.info(`Removing ${key}`);
    return this.storageService.remove(key);
  }

  info(message: string): void {
    this.logService.info(message);
  }

  async getAccounts<ExpectedAccountType>(): Promise<
    { userId: Guid; account: ExpectedAccountType }[]
  > {
    const userIds = (await this.get<Guid[]>("authenticatedAccounts")) ?? [];
    return Promise.all(
      userIds.map(async (userId) => ({
        userId,
        account: await this.get<ExpectedAccountType>(userId),
      }))
    );
  }
}
