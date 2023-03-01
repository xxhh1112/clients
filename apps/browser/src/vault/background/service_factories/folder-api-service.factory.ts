import { FolderApiServiceAbstraction } from "@bitwarden/common/vault/abstractions/folder/folder-api.service.abstraction";
import { FolderApiService } from "@bitwarden/common/vault/services/folder/folder-api.service";

import {
  apiServiceFactory,
  ApiServiceInitOptions,
} from "../../../background/service_factories/api-service.factory";
import {
  CachedServices,
  factory,
  FactoryOptions,
} from "../../../background/service_factories/factory-options";

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
