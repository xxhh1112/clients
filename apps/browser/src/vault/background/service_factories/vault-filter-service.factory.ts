import {
  collectionServiceFactory,
  CollectionServiceInitOptions,
} from "../../../admin-console/background/service-factories/collection-service.factory";
import {
  organizationServiceFactory,
  OrganizationServiceInitOptions,
} from "../../../admin-console/background/service-factories/organization-service.factory";
import {
  policyServiceFactory,
  PolicyServiceInitOptions,
} from "../../../admin-console/background/service-factories/policy-service.factory";
import {
  CachedServices,
  factory,
  FactoryOptions,
} from "../../../background/service_factories/factory-options";
import {
  stateServiceFactory,
  StateServiceInitOptions,
} from "../../../background/service_factories/state-service.factory";
import { VaultFilterService } from "../../services/vault-filter.service";

import { cipherServiceFactory, CipherServiceInitOptions } from "./cipher-service.factory";
import { folderServiceFactory, FolderServiceInitOptions } from "./folder-service.factory";

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
