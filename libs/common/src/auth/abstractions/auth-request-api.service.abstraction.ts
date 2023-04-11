import { ListResponse } from "../../models/response/list.response";
import { PasswordlessAuthRequest } from "../models/request/passwordless-auth.request";
import { PasswordlessCreateAuthRequest } from "../models/request/passwordless-create-auth.request";
import { AuthRequestResponse } from "../models/response/auth-request.response";

export abstract class AuthRequestApiService {
  // passwordless
  postAuthRequest: (request: PasswordlessCreateAuthRequest) => Promise<AuthRequestResponse>;
  getAuthResponse: (id: string, accessCode: string) => Promise<AuthRequestResponse>;
  getAuthRequest: (id: string) => Promise<AuthRequestResponse>;
  putAuthRequest: (id: string, request: PasswordlessAuthRequest) => Promise<AuthRequestResponse>;
  getAuthRequests: () => Promise<ListResponse<AuthRequestResponse>>;
  getLastAuthRequest: () => Promise<AuthRequestResponse>;
}
