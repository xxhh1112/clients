import { OrganizationService as AbstractOrganizationService } from "@bitwarden/common/abstractions/organization/organization.service.abstraction";

import { BrowserOrganizationService } from "../../services/browser-organization.service";

import { accountServiceFactory, AccountServiceInitOptions } from "./account-service.factory";
import { FactoryOptions, CachedServices, factory } from "./factory-options";
import { stateServiceFactory, StateServiceInitOptions } from "./state-service.factory";

type OrganizationServiceFactoryOptions = FactoryOptions;

export type OrganizationServiceInitOptions = OrganizationServiceFactoryOptions &
  StateServiceInitOptions &
  AccountServiceInitOptions;

export function organizationServiceFactory(
  cache: { organizationService?: AbstractOrganizationService } & CachedServices,
  opts: OrganizationServiceInitOptions
): Promise<AbstractOrganizationService> {
  return factory(
    cache,
    "organizationService",
    opts,
    async () =>
      new BrowserOrganizationService(
        await stateServiceFactory(cache, opts),
        await accountServiceFactory(cache, opts)
      )
  );
}
