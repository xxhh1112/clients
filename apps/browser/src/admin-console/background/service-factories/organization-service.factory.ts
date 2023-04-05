import {
  FactoryOptions,
  CachedServices,
  factory,
} from "../../../background/service_factories/factory-options";
import {
  stateServiceFactory,
  StateServiceInitOptions,
} from "../../../background/service_factories/state-service.factory";
import { BrowserOrganizationService } from "../../services/browser-organization.service";

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
