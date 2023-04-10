import { ApiService } from "../../abstractions/api.service";
import { EnvironmentService } from "../../abstractions/environment.service";
import { LogService } from "../../abstractions/log.service";
import { PaymentRequest } from "../../billing/models/request/payment.request";
import { TaxInfoUpdateRequest } from "../../billing/models/request/tax-info-update.request";
import { BillingHistoryResponse } from "../../billing/models/response/billing-history.response";
import { BillingPaymentResponse } from "../../billing/models/response/billing-payment.response";
import { PaymentResponse } from "../../billing/models/response/payment.response";
import { SubscriptionResponse } from "../../billing/models/response/subscription.response";
import { TaxInfoResponse } from "../../billing/models/response/tax-info.response";
import { DeleteRecoverRequest } from "../../models/request/delete-recover.request";
import { IapCheckRequest } from "../../models/request/iap-check.request";
import { KdfRequest } from "../../models/request/kdf.request";
import { KeysRequest } from "../../models/request/keys.request";
import { StorageRequest } from "../../models/request/storage.request";
import { UpdateAvatarRequest } from "../../models/request/update-avatar.request";
import { UpdateKeyRequest } from "../../models/request/update-key.request";
import { VerifyDeleteRecoverRequest } from "../../models/request/verify-delete-recover.request";
import { VerifyEmailRequest } from "../../models/request/verify-email.request";
import { ProfileResponse } from "../../models/response/profile.response";
import { Verification } from "../../types/verification";
import { AccountApiService } from "../abstractions/account-api.service";
import { InternalAccountService } from "../abstractions/account.service";
import { UserVerificationService } from "../abstractions/userVerification/user-verification.service.abstraction";
import { EmailTokenRequest } from "../models/request/email-token.request";
import { EmailRequest } from "../models/request/email.request";
import { PasswordHintRequest } from "../models/request/password-hint.request";
import { PasswordRequest } from "../models/request/password.request";
import { PreloginRequest } from "../models/request/prelogin.request";
import { RegisterRequest } from "../models/request/register.request";
import { SecretVerificationRequest } from "../models/request/secret-verification.request";
import { SetKeyConnectorKeyRequest } from "../models/request/set-key-connector-key.request";
import { SetPasswordRequest } from "../models/request/set-password.request";
import { UpdateProfileRequest } from "../models/request/update-profile.request";
import { UpdateTempPasswordRequest } from "../models/request/update-temp-password.request";
import { ApiKeyResponse } from "../models/response/api-key.response";
import { PreloginResponse } from "../models/response/prelogin.response";
import { RegisterResponse } from "../models/response/register.response";

export class AccountApiServiceImplementation implements AccountApiService {
  constructor(
    private apiService: ApiService,
    private userVerificationService: UserVerificationService,
    private logService: LogService,
    private accountService: InternalAccountService,
    private environmentService: EnvironmentService
  ) {}

  // Account APIs

  async deleteAccount(verification: Verification): Promise<void> {
    try {
      const verificationRequest = await this.userVerificationService.buildRequest(verification);
      await this.apiService.send("DELETE", "/accounts", verificationRequest, true, false);
      this.accountService.delete();
    } catch (e) {
      this.logService.error(e);
      throw e;
    }
  }

  async getProfile(): Promise<ProfileResponse> {
    const r = await this.apiService.send("GET", "/accounts/profile", null, true, true);
    return new ProfileResponse(r);
  }

  async getUserSubscription(): Promise<SubscriptionResponse> {
    const r = await this.apiService.send("GET", "/accounts/subscription", null, true, true);
    return new SubscriptionResponse(r);
  }

  async getTaxInfo(): Promise<TaxInfoResponse> {
    const r = await this.apiService.send("GET", "/accounts/tax", null, true, true);
    return new TaxInfoResponse(r);
  }

  async putProfile(request: UpdateProfileRequest): Promise<ProfileResponse> {
    const r = await this.apiService.send("PUT", "/accounts/profile", request, true, true);
    return new ProfileResponse(r);
  }

  async putAvatar(request: UpdateAvatarRequest): Promise<ProfileResponse> {
    const r = await this.apiService.send("PUT", "/accounts/avatar", request, true, true);
    return new ProfileResponse(r);
  }

  putTaxInfo(request: TaxInfoUpdateRequest): Promise<any> {
    return this.apiService.send("PUT", "/accounts/tax", request, true, false);
  }

  postEmailToken(request: EmailTokenRequest): Promise<any> {
    return this.apiService.send("POST", "/accounts/email-token", request, true, false);
  }

  postEmail(request: EmailRequest): Promise<any> {
    return this.apiService.send("POST", "/accounts/email", request, true, false);
  }

  postPassword(request: PasswordRequest): Promise<any> {
    return this.apiService.send("POST", "/accounts/password", request, true, false);
  }

  setPassword(request: SetPasswordRequest): Promise<any> {
    return this.apiService.send("POST", "/accounts/set-password", request, true, false);
  }

  postSetKeyConnectorKey(request: SetKeyConnectorKeyRequest): Promise<any> {
    return this.apiService.send("POST", "/accounts/set-key-connector-key", request, true, false);
  }

  postSecurityStamp(request: SecretVerificationRequest): Promise<any> {
    return this.apiService.send("POST", "/accounts/security-stamp", request, true, false);
  }

  async getAccountRevisionDate(): Promise<number> {
    const r = await this.apiService.send("GET", "/accounts/revision-date", null, true, true);
    return r as number;
  }

  postPasswordHint(request: PasswordHintRequest): Promise<any> {
    return this.apiService.send("POST", "/accounts/password-hint", request, false, false);
  }

  async postPremium(data: FormData): Promise<PaymentResponse> {
    const r = await this.apiService.send("POST", "/accounts/premium", data, true, true);
    return new PaymentResponse(r);
  }

  async postIapCheck(request: IapCheckRequest): Promise<any> {
    return this.apiService.send("POST", "/accounts/iap-check", request, true, false);
  }

  postReinstatePremium(): Promise<any> {
    return this.apiService.send("POST", "/accounts/reinstate-premium", null, true, false);
  }

  postCancelPremium(): Promise<any> {
    return this.apiService.send("POST", "/accounts/cancel-premium", null, true, false);
  }

  async postAccountStorage(request: StorageRequest): Promise<PaymentResponse> {
    const r = await this.apiService.send("POST", "/accounts/storage", request, true, true);
    return new PaymentResponse(r);
  }

  postAccountPayment(request: PaymentRequest): Promise<void> {
    return this.apiService.send("POST", "/accounts/payment", request, true, false);
  }

  postAccountLicense(data: FormData): Promise<any> {
    return this.apiService.send("POST", "/accounts/license", data, true, false);
  }

  postAccountKeys(request: KeysRequest): Promise<any> {
    return this.apiService.send("POST", "/accounts/keys", request, true, false);
  }

  postAccountKey(request: UpdateKeyRequest): Promise<any> {
    return this.apiService.send("POST", "/accounts/key", request, true, false);
  }

  postAccountVerifyEmail(): Promise<any> {
    return this.apiService.send("POST", "/accounts/verify-email", null, true, false);
  }

  postAccountVerifyEmailToken(request: VerifyEmailRequest): Promise<any> {
    return this.apiService.send("POST", "/accounts/verify-email-token", request, false, false);
  }

  postAccountVerifyPassword(request: SecretVerificationRequest): Promise<any> {
    return this.apiService.send("POST", "/accounts/verify-password", request, true, false);
  }

  postAccountRecoverDelete(request: DeleteRecoverRequest): Promise<any> {
    return this.apiService.send("POST", "/accounts/delete-recover", request, false, false);
  }

  postAccountRecoverDeleteToken(request: VerifyDeleteRecoverRequest): Promise<any> {
    return this.apiService.send("POST", "/accounts/delete-recover-token", request, false, false);
  }

  postAccountKdf(request: KdfRequest): Promise<any> {
    return this.apiService.send("POST", "/accounts/kdf", request, true, false);
  }

  async deleteSsoUser(organizationId: string): Promise<void> {
    return this.apiService.send("DELETE", "/accounts/sso/" + organizationId, null, true, false);
  }

  async getSsoUserIdentifier(): Promise<string> {
    return this.apiService.send("GET", "/accounts/sso/user-identifier", null, true, true);
  }

  async postUserApiKey(id: string, request: SecretVerificationRequest): Promise<ApiKeyResponse> {
    const r = await this.apiService.send("POST", "/accounts/api-key", request, true, true);
    return new ApiKeyResponse(r);
  }

  async postUserRotateApiKey(
    id: string,
    request: SecretVerificationRequest
  ): Promise<ApiKeyResponse> {
    const r = await this.apiService.send("POST", "/accounts/rotate-api-key", request, true, true);
    return new ApiKeyResponse(r);
  }

  putUpdateTempPassword(request: UpdateTempPasswordRequest): Promise<any> {
    return this.apiService.send("PUT", "/accounts/update-temp-password", request, true, false);
  }

  postConvertToKeyConnector(): Promise<void> {
    return this.apiService.send("POST", "/accounts/convert-to-key-connector", null, true, false);
  }

  // Account Billing APIs

  async getUserBillingHistory(): Promise<BillingHistoryResponse> {
    const r = await this.apiService.send("GET", "/accounts/billing/history", null, true, true);
    return new BillingHistoryResponse(r);
  }

  async getUserBillingPayment(): Promise<BillingPaymentResponse> {
    const r = await this.apiService.send(
      "GET",
      "/accounts/billing/payment-method",
      null,
      true,
      true
    );
    return new BillingPaymentResponse(r);
  }

  // Identity API Account methods:

  async postPrelogin(request: PreloginRequest): Promise<PreloginResponse> {
    const r = await this.apiService.send(
      "POST",
      "/accounts/prelogin",
      request,
      false,
      true,
      this.environmentService.getIdentityUrl()
    );
    return new PreloginResponse(r);
  }

  async postRegister(request: RegisterRequest): Promise<RegisterResponse> {
    const r = await this.apiService.send(
      "POST",
      "/accounts/register",
      request,
      false,
      true,
      this.environmentService.getIdentityUrl()
    );
    return new RegisterResponse(r);
  }
}
