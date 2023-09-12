import { Observable } from "rxjs";

import { AccountSettingsSettings } from "../platform/models/domain/account";

export abstract class SettingsService {
  settings$: Observable<AccountSettingsSettings>;
  disableFavicon$: Observable<boolean>;

  setEquivalentDomains: (equivalentDomains: string[][]) => Promise<any>;
  getEquivalentDomains: (url: string) => Set<string>;
  setDisableFavicon: (value: boolean) => Promise<any>;
  getDisableFavicon: () => boolean;
  setEnableAutoFillOverlay: (value: boolean) => Promise<void>;
  getEnableAutoFillOverlay: () => Promise<boolean>;
  setAutoFillOverlayAppearance: (value: number) => Promise<void>;
  getAutoFillOverlayAppearance: () => Promise<number>;
  clear: (userId?: string) => Promise<void>;
}
