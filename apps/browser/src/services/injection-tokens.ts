import { InjectionToken } from "@angular/core";

import { MessagingService } from "@bitwarden/common/abstractions/messaging.service";

export type ManifestVersion = chrome.runtime.Manifest["manifest_version"];

export const MANIFEST_VERSION = new InjectionToken<ManifestVersion>("MANIFEST_VERSION");

export const IN_POPUP_MESSAGING_SERVICE = new InjectionToken<MessagingService>(
  "IN_POPUP_MESSAGING_SERVICE"
);

export const BACKGROUND_MESSAGING_SERVICE = new InjectionToken<MessagingService>(
  "BACKGROUND_MESSAGING_SERVICE"
);

export const COMBINED_MESSAGING_SERVICE = new InjectionToken<MessagingService>(
  "COMBINED_MESSAGING_SERVICE"
);
