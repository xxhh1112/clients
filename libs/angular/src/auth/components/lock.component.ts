import { Directive, NgZone, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { firstValueFrom, Subject } from "rxjs";
import { concatMap, take, takeUntil } from "rxjs/operators";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { VaultTimeoutService } from "@bitwarden/common/abstractions/vaultTimeout/vaultTimeout.service";
import { VaultTimeoutSettingsService } from "@bitwarden/common/abstractions/vaultTimeout/vaultTimeoutSettings.service";
import { PolicyApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/policy/policy-api.service.abstraction";
import { InternalPolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { MasterPasswordPolicyOptions } from "@bitwarden/common/admin-console/models/domain/master-password-policy-options";
import { KeyConnectorService } from "@bitwarden/common/auth/abstractions/key-connector.service";
import { ForceResetPasswordReason } from "@bitwarden/common/auth/models/domain/force-reset-password-reason";
import { KdfConfig } from "@bitwarden/common/auth/models/domain/kdf-config";
import { SecretVerificationRequest } from "@bitwarden/common/auth/models/request/secret-verification.request";
import { MasterPasswordPolicyResponse } from "@bitwarden/common/auth/models/response/master-password-policy.response";
import { HashPurpose, KdfType, KeySuffixOptions } from "@bitwarden/common/enums";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { EncString } from "@bitwarden/common/platform/models/domain/enc-string";
import { UserSymKey } from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";
import { PasswordStrengthServiceAbstraction } from "@bitwarden/common/tools/password-strength";

import { DialogServiceAbstraction, SimpleDialogType } from "../../services/dialog";

@Directive()
export class LockComponent implements OnInit, OnDestroy {
  masterPassword = "";
  pin = "";
  showPassword = false;
  email: string;
  pinLock = false;
  webVaultHostname = "";
  formPromise: Promise<MasterPasswordPolicyResponse>;
  supportsBiometric: boolean;
  biometricLock: boolean;
  biometricText: string;
  hideInput: boolean;

  protected successRoute = "vault";
  protected forcePasswordResetRoute = "update-temp-password";
  protected onSuccessfulSubmit: () => Promise<void>;

  private invalidPinAttempts = 0;
  private pinSet: [boolean, boolean];

  private enforcedMasterPasswordOptions: MasterPasswordPolicyOptions = undefined;

  private destroy$ = new Subject<void>();

  constructor(
    protected router: Router,
    protected i18nService: I18nService,
    protected platformUtilsService: PlatformUtilsService,
    protected messagingService: MessagingService,
    protected cryptoService: CryptoService,
    protected vaultTimeoutService: VaultTimeoutService,
    protected vaultTimeoutSettingsService: VaultTimeoutSettingsService,
    protected environmentService: EnvironmentService,
    protected stateService: StateService,
    protected apiService: ApiService,
    protected logService: LogService,
    private keyConnectorService: KeyConnectorService,
    protected ngZone: NgZone,
    protected policyApiService: PolicyApiServiceAbstraction,
    protected policyService: InternalPolicyService,
    protected passwordStrengthService: PasswordStrengthServiceAbstraction,
    protected dialogService: DialogServiceAbstraction
  ) {}

  async ngOnInit() {
    this.stateService.activeAccount$
      .pipe(
        concatMap(async () => {
          await this.load();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async submit() {
    if (this.pinLock) {
      return await this.handlePinRequiredUnlock();
    }

    await this.handleMasterPasswordRequiredUnlock();
  }

  async logOut() {
    const confirmed = await this.dialogService.openSimpleDialog({
      title: { key: "logOut" },
      content: { key: "logOutConfirmation" },
      acceptButtonText: { key: "logOut" },
      type: SimpleDialogType.WARNING,
    });

    if (confirmed) {
      this.messagingService.send("logout");
    }
  }

  async unlockBiometric(): Promise<boolean> {
    if (!this.biometricLock) {
      return;
    }

    const userKey = await this.cryptoService.getUserKeyFromStorage(KeySuffixOptions.Biometric);

    if (userKey) {
      await this.setKeyAndContinue(userKey, false);
    }

    return !!userKey;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
    const input = document.getElementById(this.pinLock ? "pin" : "masterPassword");
    if (this.ngZone.isStable) {
      input.focus();
    } else {
      this.ngZone.onStable.pipe(take(1)).subscribe(() => input.focus());
    }
  }

  private async handlePinRequiredUnlock() {
    if (this.pin == null || this.pin === "") {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("pinRequired")
      );
      return;
    }

    return await this.doUnlockWithPin();
  }

  private async doUnlockWithPin() {
    let failed = true;
    try {
      const kdf = await this.stateService.getKdfType();
      const kdfConfig = await this.stateService.getKdfConfig();
      let userSymKeyPin: EncString;
      let oldPinProtected: EncString;
      if (this.pinSet[0]) {
        // MP on restart enabled
        userSymKeyPin = await this.stateService.getUserSymKeyPinEphemeral();
        oldPinProtected = await this.stateService.getDecryptedPinProtected();
      } else {
        // MP on restart disabled
        userSymKeyPin = await this.stateService.getUserSymKeyPin();
        const oldEncryptedKey = await this.stateService.getEncryptedPinProtected();
        oldPinProtected = oldEncryptedKey ? new EncString(oldEncryptedKey) : undefined;
      }

      let userSymKey: UserSymKey;
      if (oldPinProtected) {
        userSymKey = await this.decryptAndMigrateOldPinKey(true, kdf, kdfConfig, oldPinProtected);
      } else {
        userSymKey = await this.cryptoService.decryptUserSymKeyWithPin(
          this.pin,
          this.email,
          kdf,
          kdfConfig,
          userSymKeyPin
        );
      }

      const protectedPin = await this.stateService.getProtectedPin();
      const decryptedPin = await this.cryptoService.decryptToUtf8(
        new EncString(protectedPin),
        userSymKey
      );
      failed = decryptedPin !== this.pin;

      if (!failed) {
        await this.setKeyAndContinue(userSymKey);
      }
    } catch {
      failed = true;
    }

    if (failed) {
      this.invalidPinAttempts++;
      if (this.invalidPinAttempts >= 5) {
        this.messagingService.send("logout");
        return;
      }
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("invalidPin")
      );
    }
  }

  private async handleMasterPasswordRequiredUnlock() {
    if (this.masterPassword == null || this.masterPassword === "") {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("masterPasswordRequired")
      );
      return;
    }
    await this.doUnlockWithMasterPassword();
  }

  private async doUnlockWithMasterPassword() {
    const kdf = await this.stateService.getKdfType();
    const kdfConfig = await this.stateService.getKdfConfig();

    const masterKey = await this.cryptoService.makeMasterKey(
      this.masterPassword,
      this.email,
      kdf,
      kdfConfig
    );
    const storedKeyHash = await this.cryptoService.getKeyHash();

    let passwordValid = false;

    if (storedKeyHash != null) {
      // Offline unlock possible
      passwordValid = await this.cryptoService.compareAndUpdateKeyHash(
        this.masterPassword,
        masterKey
      );
    } else {
      // Online only
      const request = new SecretVerificationRequest();
      const serverKeyHash = await this.cryptoService.hashPassword(
        this.masterPassword,
        masterKey,
        HashPurpose.ServerAuthorization
      );
      request.masterPasswordHash = serverKeyHash;
      try {
        this.formPromise = this.apiService.postAccountVerifyPassword(request);
        const response = await this.formPromise;
        this.enforcedMasterPasswordOptions = MasterPasswordPolicyOptions.fromResponse(response);
        passwordValid = true;
        const localKeyHash = await this.cryptoService.hashPassword(
          this.masterPassword,
          masterKey,
          HashPurpose.LocalAuthorization
        );
        await this.cryptoService.setKeyHash(localKeyHash);
      } catch (e) {
        this.logService.error(e);
      } finally {
        this.formPromise = null;
      }
    }

    if (!passwordValid) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("invalidMasterPassword")
      );
      return;
    }

    const userKey = await this.cryptoService.decryptUserSymKeyWithMasterKey(masterKey);

    // if MP on restart is enabled, use it to get the PIN and store the ephemeral
    // pin protected user symmetric key
    if (this.pinSet[0]) {
      const protectedPin = await this.stateService.getProtectedPin();
      const pin = await this.cryptoService.decryptToUtf8(new EncString(protectedPin), userKey);
      const pinKey = await this.cryptoService.makePinKey(pin, this.email, kdf, kdfConfig);
      await this.stateService.setUserSymKeyPinEphemeral(
        await this.cryptoService.encrypt(userKey.key, pinKey)
      );
    }
    await this.setKeyAndContinue(userKey, true);
  }

  private async setKeyAndContinue(key: UserSymKey, evaluatePasswordAfterUnlock = false) {
    await this.cryptoService.setUserKey(key);
    await this.doContinue(evaluatePasswordAfterUnlock);
  }

  private async doContinue(evaluatePasswordAfterUnlock: boolean) {
    await this.stateService.setEverBeenUnlocked(true);
    this.messagingService.send("unlocked");

    if (evaluatePasswordAfterUnlock) {
      try {
        // If we do not have any saved policies, attempt to load them from the service
        if (this.enforcedMasterPasswordOptions == undefined) {
          this.enforcedMasterPasswordOptions = await firstValueFrom(
            this.policyService.masterPasswordPolicyOptions$()
          );
        }

        if (this.requirePasswordChange()) {
          await this.stateService.setForcePasswordResetReason(
            ForceResetPasswordReason.WeakMasterPassword
          );
          this.router.navigate([this.forcePasswordResetRoute]);
          return;
        }
      } catch (e) {
        // Do not prevent unlock if there is an error evaluating policies
        this.logService.error(e);
      }
    }

    if (this.onSuccessfulSubmit != null) {
      await this.onSuccessfulSubmit();
    } else if (this.router != null) {
      this.router.navigate([this.successRoute]);
    }
  }

  private async load() {
    this.pinSet = await this.vaultTimeoutSettingsService.isPinLockSet();

    let ephemeralPinSet = await this.stateService.getUserSymKeyPinEphemeral();
    ephemeralPinSet ||= await this.stateService.getDecryptedPinProtected();
    this.pinLock = (this.pinSet[0] && !!ephemeralPinSet) || this.pinSet[1];

    this.supportsBiometric = await this.platformUtilsService.supportsBiometric();
    this.biometricLock =
      (await this.vaultTimeoutSettingsService.isBiometricLockSet()) &&
      ((await this.cryptoService.hasUserKeyStored(KeySuffixOptions.Biometric)) ||
        !this.platformUtilsService.supportsSecureStorage());
    this.biometricText = await this.stateService.getBiometricText();
    this.email = await this.stateService.getEmail();
    const usesKeyConnector = await this.keyConnectorService.getUsesKeyConnector();
    this.hideInput = usesKeyConnector && !this.pinLock;

    // Users with key connector and without biometric or pin has no MP to unlock using
    if (usesKeyConnector && !(this.biometricLock || this.pinLock)) {
      await this.vaultTimeoutService.logOut();
    }

    const webVaultUrl = this.environmentService.getWebVaultUrl();
    const vaultUrl =
      webVaultUrl === "https://vault.bitwarden.com" ? "https://bitwarden.com" : webVaultUrl;
    this.webVaultHostname = Utils.getHostname(vaultUrl);
  }

  /**
   * Checks if the master password meets the enforced policy requirements
   * If not, returns false
   */
  private requirePasswordChange(): boolean {
    if (
      this.enforcedMasterPasswordOptions == undefined ||
      !this.enforcedMasterPasswordOptions.enforceOnLogin
    ) {
      return false;
    }

    const passwordStrength = this.passwordStrengthService.getPasswordStrength(
      this.masterPassword,
      this.email
    )?.score;

    return !this.policyService.evaluateMasterPassword(
      passwordStrength,
      this.masterPassword,
      this.enforcedMasterPasswordOptions
    );
  }

  /**
   * Creates a new Pin key that encrypts the user's symmetric key instead of the
   * master key. Clears the old Pin key from state.
   * @param masterPasswordOnRestart True if Master Password on Restart is enabled
   * @param kdf User's KdfType
   * @param kdfConfig User's KdfConfig
   * @param oldPinProtected The old Pin key from state (retrieved from different
   * places depending on if Master Password on Restart was enabled)
   * @returns The user's symmetric key
   */
  private async decryptAndMigrateOldPinKey(
    masterPasswordOnRestart: boolean,
    kdf: KdfType,
    kdfConfig: KdfConfig,
    oldPinProtected?: EncString
  ): Promise<UserSymKey> {
    // Decrypt
    const masterKey = await this.cryptoService.decryptMasterKeyWithPin(
      this.pin,
      this.email,
      kdf,
      kdfConfig,
      oldPinProtected
    );
    const encUserSymKey = await this.stateService.getEncryptedCryptoSymmetricKey();
    const userSymKey = await this.cryptoService.decryptUserSymKeyWithMasterKey(
      masterKey,
      new EncString(encUserSymKey)
    );
    // Migrate
    const pinKey = await this.cryptoService.makePinKey(this.pin, this.email, kdf, kdfConfig);
    const pinProtectedKey = await this.cryptoService.encrypt(userSymKey.key, pinKey);
    if (masterPasswordOnRestart) {
      await this.stateService.setDecryptedPinProtected(null);
      await this.stateService.setUserSymKeyPinEphemeral(pinProtectedKey);
    } else {
      await this.stateService.setEncryptedPinProtected(null);
      await this.stateService.setUserSymKeyPin(pinProtectedKey);
      // We previously only set the protected pin if MP on Restart was enabled
      // now we set it regardless
      const encPin = await this.cryptoService.encrypt(this.pin, userSymKey);
      await this.stateService.setProtectedPin(encPin.encryptedString);
    }
    // This also clears the old Biometrics key since the new Biometrics key will
    // be created when the user's symmetric key is set.
    await this.stateService.setCryptoMasterKeyBiometric(null);
    return userSymKey;
  }
}
