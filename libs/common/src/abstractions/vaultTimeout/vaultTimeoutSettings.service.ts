import { VaultTimeoutAction } from "../../enums/vault-timeout-action.enum";

export abstract class VaultTimeoutSettingsService {
  setVaultTimeoutOptions: (
    vaultTimeout: number,
    vaultTimeoutAction: VaultTimeoutAction
  ) => Promise<void>;
  getVaultTimeout: (userId?: string) => Promise<number>;
  getVaultTimeoutAction: (userId?: string) => Promise<VaultTimeoutAction>;
  /**
   * Has the user enabled unlock with Pin.
   * @returns [Pin with MP on Restart enabled, Pin without MP on Restart enabled]
   */
  isPinLockSet: () => Promise<[boolean, boolean]>;
  isBiometricLockSet: () => Promise<boolean>;
  clear: (userId?: string) => Promise<void>;
}
