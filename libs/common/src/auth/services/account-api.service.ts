import { ApiService } from "../../abstractions/api.service";
import { EnvironmentService } from "../../abstractions/environment.service";
import { LogService } from "../../abstractions/log.service";
import { Verification } from "../../types/verification";
import { AccountApiService } from "../abstractions/account-api.service";
import { InternalAccountService } from "../abstractions/account.service";
import { UserVerificationService } from "../abstractions/userVerification/userVerification.service.abstraction";
import { PreloginRequest } from "../models/request/prelogin.request";
import { RegisterRequest } from "../models/request/register.request";
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
