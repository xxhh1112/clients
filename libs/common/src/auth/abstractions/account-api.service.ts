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

export abstract class AccountApiService {
  // API (server project) Account Methods:
  abstract deleteAccount(verification: Verification): Promise<void>;

  getProfile: () => Promise<ProfileResponse>;
  getUserSubscription: () => Promise<SubscriptionResponse>;
  getTaxInfo: () => Promise<TaxInfoResponse>;
  putProfile: (request: UpdateProfileRequest) => Promise<ProfileResponse>;
  putAvatar: (request: UpdateAvatarRequest) => Promise<ProfileResponse>;
  putTaxInfo: (request: TaxInfoUpdateRequest) => Promise<any>;
  postEmailToken: (request: EmailTokenRequest) => Promise<any>;
  postEmail: (request: EmailRequest) => Promise<any>;
  postPassword: (request: PasswordRequest) => Promise<any>;
  setPassword: (request: SetPasswordRequest) => Promise<any>;
  postSetKeyConnectorKey: (request: SetKeyConnectorKeyRequest) => Promise<any>;
  postSecurityStamp: (request: SecretVerificationRequest) => Promise<any>;
  getAccountRevisionDate: () => Promise<number>;
  postPasswordHint: (request: PasswordHintRequest) => Promise<any>;
  postPremium: (data: FormData) => Promise<PaymentResponse>;
  postIapCheck: (request: IapCheckRequest) => Promise<any>;
  postReinstatePremium: () => Promise<any>;
  postCancelPremium: () => Promise<any>;
  postAccountStorage: (request: StorageRequest) => Promise<PaymentResponse>;
  postAccountPayment: (request: PaymentRequest) => Promise<void>;
  postAccountLicense: (data: FormData) => Promise<any>;
  postAccountKey: (request: UpdateKeyRequest) => Promise<any>;
  postAccountKeys: (request: KeysRequest) => Promise<any>;
  postAccountVerifyEmail: () => Promise<any>;
  postAccountVerifyEmailToken: (request: VerifyEmailRequest) => Promise<any>;
  postAccountVerifyPassword: (request: SecretVerificationRequest) => Promise<any>;
  postAccountRecoverDelete: (request: DeleteRecoverRequest) => Promise<any>;
  postAccountRecoverDeleteToken: (request: VerifyDeleteRecoverRequest) => Promise<any>;
  postAccountKdf: (request: KdfRequest) => Promise<any>;

  deleteSsoUser: (organizationId: string) => Promise<void>;
  getSsoUserIdentifier: () => Promise<string>;

  postUserApiKey: (id: string, request: SecretVerificationRequest) => Promise<ApiKeyResponse>;
  postUserRotateApiKey: (id: string, request: SecretVerificationRequest) => Promise<ApiKeyResponse>;
  putUpdateTempPassword: (request: UpdateTempPasswordRequest) => Promise<any>;
  postConvertToKeyConnector: () => Promise<void>;

  // Account Billing API methods:
  getUserBillingHistory: () => Promise<BillingHistoryResponse>;
  getUserBillingPayment: () => Promise<BillingPaymentResponse>;

  // Identity API Account methods:
  postPrelogin: (request: PreloginRequest) => Promise<PreloginResponse>;
  postRegister: (request: RegisterRequest) => Promise<RegisterResponse>;
}
