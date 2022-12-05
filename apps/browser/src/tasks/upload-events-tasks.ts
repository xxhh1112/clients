import { StateFactory } from "@bitwarden/common/factories/stateFactory";
import { GlobalState } from "@bitwarden/common/models/domain/global-state";

import { setAlarmTime } from "../alarms/alarm-state";
import { eventUploadServiceFactory } from "../background/service_factories/event-upload-service.factory";
import { CachedServices } from "../background/service_factories/factory-options";
import { Account } from "../models/account";

export const uploadEventAlarmName = "uploadEvents";

const opts = {
  cryptoFunctionServiceOptions: {
    win: self,
  },
  encryptServiceOptions: {
    logMacFailures: true,
  },
  logServiceOptions: {
    isDev: false,
  },
  platformUtilsServiceOptions: {
    clipboardWriteCallback: () => Promise.resolve(),
    biometricCallback: () => Promise.resolve(false),
    win: self,
  },
  stateServiceOptions: {
    stateFactory: new StateFactory(GlobalState, Account),
  },
  stateMigrationServiceOptions: {
    stateFactory: new StateFactory(GlobalState, Account),
  },
  apiServiceOptions: {
    logoutCallback: () => Promise.resolve(),
  },
};

export class UploadEventsTask {
  static async run(serviceCache: CachedServices) {
    const eventUploadService = await eventUploadServiceFactory(serviceCache, opts);
    eventUploadService.uploadEvents();

    await setAlarmTime(uploadEventAlarmName, 60 * 1000);
  }
}
