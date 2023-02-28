import { BrowserOrganizationService } from "../../services/browser-organization.service";

import { FactoryOptions, CachedServices, factory } from "./factory-options";
import { stateServiceFactory, StateServiceInitOptions } from "./state-service.factory";

type OrganizationServiceFactoryOptions = FactoryOptions;

export type OrganizationServiceInitOptions = OrganizationServiceFactoryOptions &
  StateServiceInitOptions;

export function organizationServiceFactory(
  cache: { organizationService?: BrowserOrganizationService } & CachedServices,
  opts: OrganizationServiceInitOptions
): Promise<BrowserOrganizationService> {
  return factory(
    cache,
    "organizationService",
    opts,
    async () => new BrowserOrganizationService(await stateServiceFactory(cache, opts))
  );
}
