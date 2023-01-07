import { StateFactory } from "@bitwarden/common/factories/stateFactory";
import { GlobalState } from "@bitwarden/common/models/domain/global-state";

import LockedVaultPendingNotificationsItem from "../background/models/lockedVaultPendingNotificationsItem";
import { CachedServices } from "../background/service_factories/factory-options";
import {
  stateServiceFactory,
  StateServiceInitOptions,
} from "../background/service_factories/state-service.factory";
import { BrowserApi } from "../browser/browserApi";
import { Account } from "../models/account";
import { BrowserStateService } from "../services/abstractions/browser-state.service";
import RuntimeMessage from "../types/runtime-messages";

const notificationsKey = "lockedVaultPendingNotifications";

export class PendingNotificationsListener {
  static async messageListener(
    message: RuntimeMessage,
    sender: chrome.runtime.MessageSender,
    services: CachedServices
  ) {
    const stateFactory = new StateFactory(GlobalState, Account);
    const serviceOptions: StateServiceInitOptions = {
      cryptoFunctionServiceOptions: {
        win: self,
      },
      encryptServiceOptions: {
        logMacFailures: false,
      },
      logServiceOptions: {
        isDev: false,
      },
      stateMigrationServiceOptions: {
        stateFactory: stateFactory,
      },
      stateServiceOptions: {
        stateFactory: stateFactory,
      },
    };

    const stateService = await stateServiceFactory(services, serviceOptions);
    const listener = new PendingNotificationsListener(stateService);
    await listener.listen(message, sender);
  }

  constructor(private stateService: BrowserStateService) {}

  async listen(message: RuntimeMessage, sender: chrome.runtime.MessageSender) {
    switch (message.command) {
      case "unlocked":
        await this.runUnlocked();
        break;
      case "addToLockedVaultPendingNotifications":
        await this.pushNotification(message.data);
        break;
    }
  }

  private async pushNotification(data: LockedVaultPendingNotificationsItem) {
    const pendingNotifications =
      (await this.stateService.getFromSessionMemory<LockedVaultPendingNotificationsItem[]>(
        notificationsKey
      )) || [];
    pendingNotifications.push(data);
    await this.stateService.setInSessionMemory(notificationsKey, pendingNotifications);
  }

  private async popNotification() {
    const pendingNotifications =
      (await this.stateService.getFromSessionMemory<LockedVaultPendingNotificationsItem[]>(
        notificationsKey
      )) || [];
    const notification = pendingNotifications.pop();
    await this.stateService.setInSessionMemory(notificationsKey, pendingNotifications);
    return notification;
  }

  private async runUnlocked() {
    const notification = await this.popNotification();

    if (notification) {
      // I could attempt to close the popup here like we do with the tab we open
      // I would have to send a message to the popup to close it with window.close()

      if (notification.commandToRetry.sender?.tab?.id) {
        await BrowserApi.focusSpecifiedTab(notification.commandToRetry.sender.tab.id);
      }
    }

    // TODO: Update connection? Probably not...
    // TODO: Cancel process reload? Daniel?

    if (notification) {
      await BrowserApi.tabSendMessageData(
        notification.commandToRetry.sender.tab,
        "unlockCompleted",
        notification
      );
    }
  }
}
