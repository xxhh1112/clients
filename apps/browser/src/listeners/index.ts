import NotificationBackground from "../background/notification.background";
import { CipherContextMenuHandler } from "../browser/cipher-context-menu-handler";
import { ContextMenuClickedHandler } from "../browser/context-menu-clicked-handler";

import { combine } from "./combine";
import { onCommandListener } from "./onCommandListener";
import { onInstallListener } from "./onInstallListener";
import { NotificationBarPageDetailsRelay } from "./page-details-relay";
import { PendingNotificationsListener } from "./pending-notifications-listener";
import { runtimeListener } from "./runtime-listener";
import { UpdateBadge } from "./update-badge";

const tabsOnActivatedListener = combine([
  UpdateBadge.tabsOnActivatedListener,
  CipherContextMenuHandler.tabsOnActivatedListener,
]);

const tabsOnReplacedListener = combine([
  UpdateBadge.tabsOnReplacedListener,
  CipherContextMenuHandler.tabsOnReplacedListener,
]);

const tabsOnUpdatedListener = combine([
  UpdateBadge.tabsOnUpdatedListener,
  CipherContextMenuHandler.tabsOnUpdatedListener,
]);

const contextMenusClickedListener = ContextMenuClickedHandler.onClickedListener;

const runtimeMessageListener = combine([
  UpdateBadge.messageListener,
  CipherContextMenuHandler.messageListener,
  ContextMenuClickedHandler.messageListener,
  NotificationBarPageDetailsRelay.messageListener,
  NotificationBackground.messageListener,
  runtimeListener,
  PendingNotificationsListener.messageListener,
]);

export {
  tabsOnActivatedListener,
  tabsOnReplacedListener,
  tabsOnUpdatedListener,
  contextMenusClickedListener,
  runtimeMessageListener,
  onCommandListener,
  onInstallListener,
};
