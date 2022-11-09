import MainBackground from "./background/main.background";
import { BrowserApi } from "./browser/browserApi";
import { ClearClipboard } from "./clipboard";
import { NotificationBar } from "./listeners/notification-bar";
import { onCommandListener } from "./listeners/onCommandListener";
import { onInstallListener } from "./listeners/onInstallListener";
import { UpdateBadge } from "./listeners/update-badge";

const manifestV3MessageListeners: ((
  serviceCache: Record<string, unknown>,
  message: { command: string },
  sender: chrome.runtime.MessageSender
) => void | Promise<void>)[] = [UpdateBadge.messageListener, NotificationBar.messageListener];
type AlarmAction = (executionTime: Date, serviceCache: Record<string, unknown>) => void;

const AlarmActions: AlarmAction[] = [ClearClipboard.run];

if (BrowserApi.manifestVersion === 3) {
  chrome.commands.onCommand.addListener(onCommandListener);
  chrome.runtime.onInstalled.addListener(onInstallListener);
  chrome.tabs.onActivated.addListener(UpdateBadge.tabsOnActivatedListener);
  chrome.tabs.onReplaced.addListener(UpdateBadge.tabsOnReplacedListener);
  chrome.tabs.onUpdated.addListener(UpdateBadge.tabsOnUpdatedListener);
  BrowserApi.messageListener("runtime.background", (message, sender) => {
    const serviceCache = {};

    manifestV3MessageListeners.forEach((listener) => {
      listener(serviceCache, message, sender);
    });
  });

  chrome.alarms.onAlarm.addListener((_alarm) => {
    const executionTime = new Date();
    const serviceCache = {};

    for (const alarmAction of AlarmActions) {
      alarmAction(executionTime, serviceCache);
    }
  });
} else {
  const bitwardenMain = ((window as any).bitwardenMain = new MainBackground());
  bitwardenMain.bootstrap().then(() => {
    // Finished bootstrapping
  });
}
