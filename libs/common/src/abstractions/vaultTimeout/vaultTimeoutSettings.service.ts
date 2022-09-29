import { Observable } from "rxjs";

export type VaultTimeoutSettings = {
  timeout: number;
  action: string;
};

export abstract class VaultTimeoutSettingsService {
  abstract vaultTimeoutOptions$: Observable<VaultTimeoutSettings>;
  setVaultTimeoutOptions: (vaultTimeout: number, vaultTimeoutAction: string) => Promise<void>;
  getVaultTimeout: (userId?: string) => Promise<number>;
  isPinLockSet: () => Promise<[boolean, boolean]>;
  isBiometricLockSet: () => Promise<boolean>;
  clear: (userId?: string) => Promise<void>;
}
