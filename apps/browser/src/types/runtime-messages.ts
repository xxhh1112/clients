import AddLoginRuntimeMessage from "../background/models/addLoginRuntimeMessage";
import ChangePasswordRuntimeMessage from "../background/models/changePasswordRuntimeMessage";
import LockedVaultPendingNotificationsItem from "../background/models/lockedVaultPendingNotificationsItem";
import AutofillPageDetails from "../models/autofillPageDetails";

type RuntimeMessage =
  | BackgroundCollectPageDetails
  | UnlockCompleted
  | BackgroundGetDataForTab
  | BackgroundCloseNotificationBar
  | BackgroundAdjustNotificationBar
  | BackgroundAddLogin
  | BackgroundChangedPassword
  | BackgroundAddClose
  | BackgroundChangeClose
  | BackgroundAddSave
  | BackgroundChangeSave
  | BackgroundNeverSave
  | CollectPageDetailsResponse
  | PromptForLoginMessage
  | UnlockedMessage
  | AddToLockedVaultPendingNotificationsMessage;

type RuntimeMessageBase<T extends string> = {
  command: T;
};

export type BackgroundCollectPageDetails = RuntimeMessageBase<"bgCollectPageDetails"> & {
  sender: string;
};

export type UnlockCompleted = RuntimeMessageBase<"unlockCompleted"> & {
  data: {
    target: string;
    commandToRetry: {
      msg: RuntimeMessage;
      sender: chrome.runtime.MessageSender;
    };
  };
};

export type BackgroundGetDataForTab = RuntimeMessageBase<"bgGetDataForTab"> & {
  responseCommand: string;
};

export type BackgroundCloseNotificationBar = RuntimeMessageBase<"bgCloseNotificationBar">;

export type BackgroundAdjustNotificationBar = RuntimeMessageBase<"bgAdjustNotificationBar"> & {
  data: { height: number };
};

export type BackgroundAddLogin = RuntimeMessageBase<"bgAddLogin"> & {
  login: AddLoginRuntimeMessage;
};

export type BackgroundChangedPassword = RuntimeMessageBase<"bgChangedPassword"> & {
  data: ChangePasswordRuntimeMessage;
};

export type BackgroundAddClose = RuntimeMessageBase<"bgAddClose">;

export type BackgroundChangeClose = RuntimeMessageBase<"bgChangeClose">;

type BackgroundSaveBase = {
  folder: string;
};

export type BackgroundAddSave = RuntimeMessageBase<"bgAddSave"> & BackgroundSaveBase;

export type BackgroundChangeSave = RuntimeMessageBase<"bgChangeSave"> & BackgroundSaveBase;

export type BackgroundNeverSave = RuntimeMessageBase<"bgNeverSave">;

export type CollectPageDetailsResponse = RuntimeMessageBase<"collectPageDetailsResponse"> & {
  sender: string;
  tab: chrome.tabs.Tab;
  details: AutofillPageDetails;
};

export type PromptForLoginMessage = RuntimeMessageBase<"promptForLogin">;

export type UnlockedMessage = RuntimeMessageBase<"unlocked">;

export type AddToLockedVaultPendingNotificationsMessage =
  RuntimeMessageBase<"addToLockedVaultPendingNotifications"> & {
    data: LockedVaultPendingNotificationsItem;
  };

export default RuntimeMessage;
