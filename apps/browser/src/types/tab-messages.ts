import LockedVaultPendingNotificationsItem from "../background/models/lockedVaultPendingNotificationsItem";
import AutofillPageDetails from "../models/autofillPageDetails";
import { FormData } from "../services/abstractions/autofill.service";

type TabMessage =
  | CopyTextTabMessage
  | TabMessageBase<"clearClipboard">
  | CollectPageDetailsMessage
  | CollectPageDetailsImmediatelyMessage
  | NotificationBarPageDetailsMessage
  | CloseNotificationBarMessage
  | AdjustNotificationBarMessage
  | AddToLockedVaultPendingNotificationsMessage;

export type TabMessageBase<T extends string> = {
  command: T;
};

export type CopyTextTabMessage = TabMessageBase<"copyText"> & {
  text: string;
};

export type CollectPageDetailsMessage = TabMessageBase<"collectPageDetails"> & {
  tab: chrome.tabs.Tab;
  sender: string;
};

export type CollectPageDetailsImmediatelyMessage = TabMessageBase<"collectPageDetailsImmediately">;

export type NotificationBarPageDetailsMessage = TabMessageBase<"notificationBarPageDetails"> & {
  data: {
    details: AutofillPageDetails;
    forms: FormData[];
  };
};

export type CloseNotificationBarMessage = TabMessageBase<"closeNotificationBar">;

export type AdjustNotificationBarMessage = TabMessageBase<"adjustNotificationBar"> & {
  data: { height: number };
};

export type AddToLockedVaultPendingNotificationsMessage =
  TabMessageBase<"addToLockedVaultPendingNotifications"> & {
    data: LockedVaultPendingNotificationsItem;
  };

export default TabMessage;
