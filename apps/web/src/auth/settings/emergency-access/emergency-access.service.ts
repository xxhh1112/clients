import { Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { PolicyData } from "@bitwarden/common/admin-console/models/data/policy.data";
import { MasterPasswordPolicyOptions } from "@bitwarden/common/admin-console/models/domain/master-password-policy-options";
import { Policy } from "@bitwarden/common/admin-console/models/domain/policy";
import { PolicyResponse } from "@bitwarden/common/admin-console/models/response/policy.response";
import { KdfConfig } from "@bitwarden/common/auth/models/domain/kdf-config";
import { EmergencyAccessConfirmRequest } from "@bitwarden/common/auth/models/request/emergency-access-confirm.request";
import { EmergencyAccessPasswordRequest } from "@bitwarden/common/auth/models/request/emergency-access-password.request";
import { EmergencyAccessGranteeDetailsResponse } from "@bitwarden/common/auth/models/response/emergency-access.response";
import { Utils } from "@bitwarden/common/misc/utils";
import { SymmetricCryptoKey } from "@bitwarden/common/models/domain/symmetric-crypto-key";

/**
 * Emergency Access Service
 *
 * https://bitwarden.com/help/emergency-access/
 *
 * Emergency Access works by sharing the grantors key with the grantee. In order to prevent unauthorized access to the
 * grantors data, the key is escrowed by the Bitwarden servers. The shared key is encrypted with the grantee's public
 * key.
 */
@Injectable()
export class EmergencyAccessService {
  constructor(
    private apiService: ApiService,
    private cryptoService: CryptoService,
    private i18nService: I18nService,
    private logService: LogService,
    private platformUtilsService: PlatformUtilsService,
    private policyService: PolicyService
  ) {}

  /**
   * Retrieve the formatted users public fingerprint.
   *
   * TODO: This should probably be moved to a more generic user service.
   *
   * @param userId User Id
   * @returns Fingerprint for the user's public key
   */
  async getFingerprintForUser(userId: string) {
    const publicKeyResponse = await this.apiService.getUserPublicKey(userId);

    if (publicKeyResponse == null) {
      return null;
    }

    const publicKey = Utils.fromB64ToArray(publicKeyResponse.publicKey);
    const fingerprint = await this.cryptoService.getFingerprint(userId, publicKey.buffer);

    return fingerprint?.join("-");
  }

  /**
   * Confirm the grantee as an emergency access contact.
   *
   * Performs a key exchange with the grantee, and sends the grantors encryption key encrypted using the grantees
   * public key to the bitwarden server for escrow.
   *
   * @param details
   */
  async confirmUser(details: EmergencyAccessGranteeDetailsResponse) {
    const encKey = await this.cryptoService.getEncKey();
    const publicKeyResponse = await this.apiService.getUserPublicKey(details.granteeId);
    const publicKey = Utils.fromB64ToArray(publicKeyResponse.publicKey);

    try {
      this.logService.debug(
        "User's fingerprint: " +
          (await this.cryptoService.getFingerprint(details.granteeId, publicKey.buffer)).join("-")
      );
    } catch {
      // Ignore errors since it's just a debug message
    }

    const encryptedKey = await this.cryptoService.rsaEncrypt(encKey.key, publicKey.buffer);
    const request = new EmergencyAccessConfirmRequest();
    request.key = encryptedKey.encryptedString;
    await this.apiService.postEmergencyAccessConfirm(details.id, request);
  }

  /**
   * Fetch the applicable password policies for the relevant user affected by the takeover request.
   *
   * @param id Emergency Access Id
   * @returns MasterPasswordPolicyOptions active for the relevant user
   */
  async getPasswordPolicies(id: string): Promise<MasterPasswordPolicyOptions | undefined> {
    const response = await this.apiService.getEmergencyGrantorPolicies(id);

    if (response.data == null || response.data.length <= 0) {
      return undefined;
    }

    const policies = response.data.map(
      (policyResponse: PolicyResponse) => new Policy(new PolicyData(policyResponse))
    );

    return await firstValueFrom(this.policyService.masterPasswordPolicyOptions$(policies));
  }

  /**
   * Takeover the existing users account.
   *
   * Works by generating a new key and password hash for the user from the old key.
   *
   * @param id Emergency Access Id
   * @param newPassword New password
   * @param email Existing email, used as salt for the password
   */
  async takeover(id: string, newPassword: string, email: string) {
    const takeoverResponse = await this.apiService.postEmergencyAccessTakeover(id);

    const oldKeyBuffer = await this.cryptoService.rsaDecrypt(takeoverResponse.keyEncrypted);
    const oldEncKey = new SymmetricCryptoKey(oldKeyBuffer);

    if (oldEncKey == null) {
      throw new Error("Old encryption key is null.");
    }

    const key = await this.cryptoService.makeKey(
      newPassword,
      email,
      takeoverResponse.kdf,
      new KdfConfig(
        takeoverResponse.kdfIterations,
        takeoverResponse.kdfMemory,
        takeoverResponse.kdfParallelism
      )
    );

    const masterPasswordHash = await this.cryptoService.hashPassword(newPassword, key);

    const encKey = await this.cryptoService.remakeEncKey(key, oldEncKey);

    const request = new EmergencyAccessPasswordRequest();
    request.newMasterPasswordHash = masterPasswordHash;
    request.key = encKey[1].encryptedString;

    await this.apiService.postEmergencyAccessPassword(id, request);
  }

  /**
   * Delete the emergency access request.
   *
   * @param id Emergency Access Id
   * @param name Name of the user (for the confirm dialog)
   * @returns
   */
  async delete(id: string, name: string) {
    const confirmed = await this.platformUtilsService.showDialog(
      this.i18nService.t("removeUserConfirmation"),
      name,
      this.i18nService.t("yes"),
      this.i18nService.t("no"),
      "warning"
    );

    if (!confirmed) {
      return false;
    }

    await this.apiService.deleteEmergencyAccess(id);
    this.platformUtilsService.showToast("success", null, this.i18nService.t("removedUserId", name));

    return true;
  }
}
