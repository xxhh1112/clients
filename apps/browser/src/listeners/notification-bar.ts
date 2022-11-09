import { StateFactory } from "@bitwarden/common/factories/stateFactory";
import { GlobalState } from "@bitwarden/common/models/domain/global-state";

import {
  autofillServiceFactory,
  AutoFillServiceInitOptions,
} from "../background/service_factories/autofill-service.factory";
import { CachedServices } from "../background/service_factories/factory-options";
import { Account } from "../models/account";
import AutofillPageDetails from "../models/autofillPageDetails";
import { AutofillService } from "../services/abstractions/autofill.service";
import { RuntimeMessage } from "../types/runtime-messages";
import { TabMessage } from "../types/tab-messages";

export class NotificationBar {
  // TODO: Make work with 'combine'
  static async messageListener(
    services: CachedServices,
    message: RuntimeMessage,
    sender: chrome.runtime.MessageSender
  ) {
    const stateFactory = new StateFactory(GlobalState, Account);
    const serviceOptions: AutoFillServiceInitOptions = {
      apiServiceOptions: {
        logoutCallback: null,
      },
      cryptoFunctionServiceOptions: {
        win: self,
      },
      encryptServiceOptions: {
        logMacFailures: false,
      },
      i18nServiceOptions: {
        systemLanguage: chrome.i18n.getUILanguage(),
      },
      logServiceOptions: {
        isDev: false,
      },
      platformUtilsServiceOptions: {
        biometricCallback: null,
        clipboardWriteCallback: null,
        win: self,
      },
      stateMigrationServiceOptions: {
        stateFactory: stateFactory,
      },
      stateServiceOptions: {
        stateFactory: stateFactory,
      },
    };

    const autofillService = await autofillServiceFactory(services, serviceOptions);

    const notificationBar = new NotificationBar(autofillService);
    await notificationBar.listen(message, sender);
  }

  constructor(private autofillService: AutofillService) {}

  async listen(message: RuntimeMessage, sender: chrome.runtime.MessageSender) {
    // Can only relay messages that were sent from a tab because we will send it back to the tab
    if (!sender.tab) {
      return;
    }

    if (message.command !== "bgCollectPageDetails") {
      return;
    }

    const pageDetails = await this.collectPageDetailsImmediately(sender);

    const forms = this.autofillService.getFormsWithPasswordFields(pageDetails);

    chrome.tabs.sendMessage(
      sender.tab.id,
      {
        command: "notificationBarPageDetails",
        data: {
          details: pageDetails,
          forms: forms,
        },
      } as TabMessage,
      {
        frameId: sender.frameId,
      }
    );
  }

  private collectPageDetailsImmediately(
    sender: chrome.runtime.MessageSender
  ): Promise<AutofillPageDetails> {
    // TODO: Use BrowserApi from Context Menu MV3
    return new Promise<AutofillPageDetails>((resolve, reject) => {
      chrome.tabs.sendMessage(
        sender.tab.id,
        {
          command: "collectPageDetailsImmediately",
        } as TabMessage,
        {
          frameId: sender.frameId,
        },
        (response: AutofillPageDetails) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }

          resolve(response);
        }
      );
    });
  }
}
