import { PreloginRequest } from "../models/request/prelogin.request";
import { RegisterRequest } from "../models/request/register.request";
import { PreloginResponse } from "../models/response/prelogin.response";
import { RegisterResponse } from "../models/response/register.response";

export abstract class AccountsApiService {
  postPrelogin: (request: PreloginRequest) => Promise<PreloginResponse>;

  postRegister: (request: RegisterRequest) => Promise<RegisterResponse>;
}
