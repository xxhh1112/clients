import { concatMap, distinctUntilChanged, filter, Subject } from "rxjs";

import { CryptoService } from "../../abstractions/crypto.service";
import { PolicyService } from "../../abstractions/policy/policy.service.abstraction";
import { StateService } from "../../abstractions/state.service";
import {
  VaultTimeoutSettings,
  VaultTimeoutSettingsService as VaultTimeoutSettingsServiceAbstraction,
} from "../../abstractions/vaultTimeout/vaultTimeoutSettings.service";
import { PolicyType } from "../../enums/policyType";

export class VaultTimeoutSettingsService implements VaultTimeoutSettingsServiceAbstraction {
  private _vaultTimeoutOptions = new Subject<VaultTimeoutSettings>();
  vaultTimeoutOptions$ = this._vaultTimeoutOptions.asObservable();

  constructor(
    private cryptoService: CryptoService,
    private policyService: PolicyService,
    private stateService: StateService
  ) {
    this.stateService.activeAccount$
      .pipe(
        filter((userId) => userId != null),
        distinctUntilChanged(),
        concatMap(async (userId) => {
          if (userId == null) {
            return;
          }

          const timeout = await this.stateService.getVaultTimeout({ userId });
          const action = await this.stateService.getVaultTimeoutAction({ userId });
          this._vaultTimeoutOptions.next({ timeout: timeout, action: action });
        })
      )
      .subscribe();
  }

  async setVaultTimeoutOptions(timeout: number, action: string): Promise<void> {
    await this.stateService.setVaultTimeout(timeout);

    await this.stateService.setVaultTimeoutAction(action);
    await this.cryptoService.toggleKey();
    this._vaultTimeoutOptions.next({ timeout: timeout, action: action });
  }

  async isPinLockSet(): Promise<[boolean, boolean]> {
    const protectedPin = await this.stateService.getProtectedPin();
    const pinProtectedKey = await this.stateService.getEncryptedPinProtected();
    return [protectedPin != null, pinProtectedKey != null];
  }

  async isBiometricLockSet(): Promise<boolean> {
    return await this.stateService.getBiometricUnlock();
  }

  async getVaultTimeout(userId?: string): Promise<number> {
    const vaultTimeout = await this.stateService.getVaultTimeout({ userId: userId });

    await this.validateVaultPolicies(userId, vaultTimeout);

    return vaultTimeout;
  }

  async clear(userId?: string): Promise<void> {
    await this.stateService.setEverBeenUnlocked(false, { userId: userId });
    await this.stateService.setDecryptedPinProtected(null, { userId: userId });
    await this.stateService.setProtectedPin(null, { userId: userId });
  }

  private async validateVaultPolicies(userId: string, vaultTimeout: number) {
    if (
      await this.policyService.policyAppliesToUser(PolicyType.MaximumVaultTimeout, null, userId)
    ) {
      const policy = await this.policyService.getAll(PolicyType.MaximumVaultTimeout, userId);
      // Remove negative values, and ensure it's smaller than maximum allowed value according to policy
      let timeout = Math.min(vaultTimeout, policy[0].data.minutes);

      if (vaultTimeout == null || timeout < 0) {
        timeout = policy[0].data.minutes;
      }

      // We really shouldn't need to set the value here, but multiple services relies on this value being correct.
      if (vaultTimeout !== timeout) {
        await this.stateService.setVaultTimeout(timeout, { userId: userId });
      }

      return timeout;
    }
  }
}
