import { FolderApiServiceAbstraction } from "@bitwarden/common/abstractions/folder/folder-api.service.abstraction";
import { FolderApiService } from "@bitwarden/common/services/folder/folder-api.service";

import { apiServiceFactory, ApiServiceInitOptions } from "./api-service.factory";
import { CachedServices, factory, FactoryOptions } from "./factory-options";
import { folderServiceFactory, FolderServiceInitOptions } from "./folder-service.factory";

type FolderApiServiceFactoryOptions = FactoryOptions;

export type FolderApiServiceInitOptions = FolderApiServiceFactoryOptions &
  FolderServiceInitOptions &
  ApiServiceInitOptions;

export function folderApiServiceFactory(
  cache: { folderApiService?: FolderApiServiceAbstraction } & CachedServices,
  opts: FolderApiServiceInitOptions
): Promise<FolderApiServiceAbstraction> {
  return factory(
    cache,
    "folderApiService",
    opts,
    async () =>
      new FolderApiService(
        await folderServiceFactory(cache, opts),
        await apiServiceFactory(cache, opts)
      )
  );
}
