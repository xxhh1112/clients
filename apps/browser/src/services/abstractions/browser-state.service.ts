import { StateService as BaseStateServiceAbstraction } from "@bitwarden/common/abstractions/state.service";
import { StorageOptions } from "@bitwarden/common/models/domain/storage-options";

import { BrowserComponentState } from "../../models/browserComponentState";
import { BrowserGroupingsComponentState } from "../../models/browserGroupingsComponentState";
import { BrowserSendComponentState } from "../../models/browserSendComponentState";

export abstract class BrowserStateService extends BaseStateServiceAbstraction {
  getBrowserGroupingComponentState: (
    options?: StorageOptions
  ) => Promise<BrowserGroupingsComponentState>;
  setBrowserGroupingComponentState: (
    value: BrowserGroupingsComponentState,
    options?: StorageOptions
  ) => Promise<void>;
  getBrowserVaultItemsComponentState: (options?: StorageOptions) => Promise<BrowserComponentState>;
  setBrowserVaultItemsComponentState: (
    value: BrowserComponentState,
    options?: StorageOptions
  ) => Promise<void>;
  getBrowserSendComponentState: (options?: StorageOptions) => Promise<BrowserSendComponentState>;
  setBrowserSendComponentState: (
    value: BrowserSendComponentState,
    options?: StorageOptions
  ) => Promise<void>;
  getBrowserSendTypeComponentState: (options?: StorageOptions) => Promise<BrowserComponentState>;
  setBrowserSendTypeComponentState: (
    value: BrowserComponentState,
    options?: StorageOptions
  ) => Promise<void>;
}
