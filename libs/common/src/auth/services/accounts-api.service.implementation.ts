import { ApiService } from "../../abstractions/api.service";
import { EnvironmentService } from "../../abstractions/environment.service";
import { AccountsApiService } from "../abstractions/accounts-api.service.abstraction";
import { PreloginRequest } from "../models/request/prelogin.request";
import { RegisterRequest } from "../models/request/register.request";
import { PreloginResponse } from "../models/response/prelogin.response";
import { RegisterResponse } from "../models/response/register.response";

export class AccountsApiServiceImplementation implements AccountsApiService {
  constructor(private environmentService: EnvironmentService, private apiService: ApiService) {}

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
