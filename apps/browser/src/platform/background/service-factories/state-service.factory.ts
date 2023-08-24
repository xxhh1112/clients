import { StateFactory } from "@bitwarden/common/platform/factories/state-factory";
import { GlobalState } from "@bitwarden/common/platform/models/domain/global-state";

import { Account } from "../../../models/account";
import { BrowserStateService as BrowserStateServiceAbstraction } from "../../services/abstractions/browser-state.service";
import { BrowserStateService } from "../../services/browser-state.service";

import { CachedServices, factory, FactoryOptions } from "./factory-options";
import { logServiceFactory, LogServiceInitOptions } from "./log-service.factory";
import {
  stateMigrationServiceFactory,
  StateMigrationServiceInitOptions,
} from "./state-migration-service.factory";
import {
  diskStorageServiceFactory,
  secureStorageServiceFactory,
  memoryStorageServiceFactory,
  DiskStorageServiceInitOptions,
  SecureStorageServiceInitOptions,
  MemoryStorageServiceInitOptions,
} from "./storage-service.factory";

type StateServiceFactoryOptions = FactoryOptions & {
  stateServiceOptions: {
    useAccountCache?: boolean;
    stateFactory: StateFactory<GlobalState, Account>;
  };
};

export type StateServiceInitOptions = StateServiceFactoryOptions &
  DiskStorageServiceInitOptions &
  SecureStorageServiceInitOptions &
  MemoryStorageServiceInitOptions &
  LogServiceInitOptions &
  StateMigrationServiceInitOptions;

export async function stateServiceFactory(
  cache: { stateService?: BrowserStateServiceAbstraction } & CachedServices,
  opts: StateServiceInitOptions
): Promise<BrowserStateServiceAbstraction> {
  const service = await factory(cache, "stateService", opts, async () => {
    const result = new BrowserStateService(
      await diskStorageServiceFactory(cache, opts),
      await secureStorageServiceFactory(cache, opts),
      await memoryStorageServiceFactory(cache, opts),
      await logServiceFactory(cache, opts),
      await stateMigrationServiceFactory(cache, opts),
      opts.stateServiceOptions.stateFactory,
      opts.stateServiceOptions.useAccountCache
    );
    await result.init();
    return result;
  });
  return service;
}
