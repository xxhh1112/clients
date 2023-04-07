import { Verification } from "../../types/verification";
import { PreloginRequest } from "../models/request/prelogin.request";
import { RegisterRequest } from "../models/request/register.request";
import { PreloginResponse } from "../models/response/prelogin.response";
import { RegisterResponse } from "../models/response/register.response";

export abstract class AccountApiService {
  // API (server project) Account Methods
  abstract deleteAccount(verification: Verification): Promise<void>;

  // Identity API Account methods:
  postPrelogin: (request: PreloginRequest) => Promise<PreloginResponse>;
  postRegister: (request: RegisterRequest) => Promise<RegisterResponse>;
}
