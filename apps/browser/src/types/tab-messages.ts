import AutofillPageDetails from "../models/autofillPageDetails";
import { FormData } from "../services/abstractions/autofill.service";

export type TabMessage =
  | CopyTextTabMessage
  | TabMessageBase<"clearClipboard">
  | CollectPageDetails
  | CollectPageDetailsImmediately
  | NotificationBarPageDetails;

export type TabMessageBase<T extends string> = {
  command: T;
};

export type CopyTextTabMessage = TabMessageBase<"copyText"> & {
  text: string;
};

type CollectPageDetails = TabMessageBase<"collectPageDetails"> & {
  tab: chrome.tabs.Tab;
  sender: string;
};

type CollectPageDetailsImmediately = TabMessageBase<"collectPageDetailsImmediately">;

type NotificationBarPageDetails = TabMessageBase<"notificationBarPageDetails"> & {
  data: {
    details: AutofillPageDetails;
    forms: FormData[];
  };
};
