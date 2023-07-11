import { VaultTimeoutAction } from "../../enums/vault-timeout-action.enum";
import { PinLockType } from "../../services/vaultTimeout/vaultTimeoutSettings.service";

export abstract class VaultTimeoutSettingsService {
  setVaultTimeoutOptions: (
    vaultTimeout: number,
    vaultTimeoutAction: VaultTimeoutAction
  ) => Promise<void>;
  getVaultTimeout: (userId?: string) => Promise<number>;
  getVaultTimeoutAction: (userId?: string) => Promise<VaultTimeoutAction>;
  /**
   * Has the user enabled unlock with Pin.
   * @returns PinLockType
   */
  isPinLockSet: () => Promise<PinLockType>;
  isBiometricLockSet: () => Promise<boolean>;
  clear: (userId?: string) => Promise<void>;
}
