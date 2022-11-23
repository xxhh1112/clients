import { EventService as AbstractEventService } from "@bitwarden/common/abstractions/event/event.service";
import { EventService } from "@bitwarden/common/services/event/event.service";

import { cipherServiceFactory, CipherServiceInitOptions } from "./cipher-service.factory";
import {
  eventUploadServiceFactory,
  EventUploadServiceInitOptions,
} from "./event-upload-service.factory";
import { FactoryOptions, CachedServices, factory } from "./factory-options";
import {
  organizationServiceFactory,
  OrganizationServiceInitOptions,
} from "./organization-service.factory";
import { stateServiceFactory, StateServiceInitOptions } from "./state-service.factory";

type EventServiceOptions = FactoryOptions;

export type EventServiceInitOptions = EventServiceOptions &
  CipherServiceInitOptions &
  StateServiceInitOptions &
  OrganizationServiceInitOptions &
  EventUploadServiceInitOptions;

export function eventServiceFactory(
  cache: { eventService?: AbstractEventService } & CachedServices,
  opts: EventServiceInitOptions
): Promise<AbstractEventService> {
  return factory(
    cache,
    "eventService",
    opts,
    async () =>
      new EventService(
        await cipherServiceFactory(cache, opts),
        await stateServiceFactory(cache, opts),
        await organizationServiceFactory(cache, opts),
        await eventUploadServiceFactory(cache, opts)
      )
  );
}
