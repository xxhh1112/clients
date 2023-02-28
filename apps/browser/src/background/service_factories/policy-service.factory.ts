import { BrowserPolicyService } from "../../services/browser-policy.service";

import { CachedServices, factory, FactoryOptions } from "./factory-options";
import {
  organizationServiceFactory,
  OrganizationServiceInitOptions,
} from "./organization-service.factory";
import {
  stateServiceFactory as stateServiceFactory,
  StateServiceInitOptions,
} from "./state-service.factory";

type PolicyServiceFactoryOptions = FactoryOptions;

export type PolicyServiceInitOptions = PolicyServiceFactoryOptions &
  StateServiceInitOptions &
  OrganizationServiceInitOptions;

export function policyServiceFactory(
  cache: { policyService?: BrowserPolicyService } & CachedServices,
  opts: PolicyServiceInitOptions
): Promise<BrowserPolicyService> {
  return factory(
    cache,
    "policyService",
    opts,
    async () =>
      new BrowserPolicyService(
        await stateServiceFactory(cache, opts),
        await organizationServiceFactory(cache, opts)
      )
  );
}
