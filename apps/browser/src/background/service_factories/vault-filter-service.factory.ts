import { VaultFilterService } from "../../services/vaultFilter.service";

import { cipherServiceFactory, CipherServiceInitOptions } from "./cipher-service.factory";
import {
  collectionServiceFactory,
  CollectionServiceInitOptions,
} from "./collection-service.factory";
import { CachedServices, factory, FactoryOptions } from "./factory-options";
import { folderServiceFactory, FolderServiceInitOptions } from "./folder-service.factory";
import {
  organizationServiceFactory,
  OrganizationServiceInitOptions,
} from "./organization-service.factory";
import { policyServiceFactory, PolicyServiceInitOptions } from "./policy-service.factory";
import { stateServiceFactory, StateServiceInitOptions } from "./state-service.factory";

type VaultFilterServiceFactoryOptions = FactoryOptions;

export type VaultFilterServiceInitOptions = VaultFilterServiceFactoryOptions &
  StateServiceInitOptions &
  OrganizationServiceInitOptions &
  FolderServiceInitOptions &
  CipherServiceInitOptions &
  CollectionServiceInitOptions &
  PolicyServiceInitOptions;

export function vaultFilterServiceFactory(
  cache: { vaultFilterService?: VaultFilterService } & CachedServices,
  opts: VaultFilterServiceInitOptions
): Promise<VaultFilterService> {
  return factory(
    cache,
    "vaultFilterService",
    opts,
    async () =>
      new VaultFilterService(
        await stateServiceFactory(cache, opts),
        await organizationServiceFactory(cache, opts),
        await folderServiceFactory(cache, opts),
        await cipherServiceFactory(cache, opts),
        await collectionServiceFactory(cache, opts),
        await policyServiceFactory(cache, opts)
      )
  );
}
