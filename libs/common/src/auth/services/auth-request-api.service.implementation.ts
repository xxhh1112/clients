import { ApiService } from "../../abstractions/api.service";
import { ListResponse } from "../../models/response/list.response";
import { AuthRequestApiService as AuthRequestApiServiceAbstraction } from "../abstractions/auth-request-api.service.abstraction";
import { PasswordlessAuthRequest } from "../models/request/passwordless-auth.request";
import { PasswordlessCreateAuthRequest } from "../models/request/passwordless-create-auth.request";
import { AuthRequestResponse } from "../models/response/auth-request.response";

export class AuthRequestApiServiceImplementation implements AuthRequestApiServiceAbstraction {
  constructor(private apiService: ApiService) {}

  async postAuthRequest(request: PasswordlessCreateAuthRequest): Promise<AuthRequestResponse> {
    const r = await this.apiService.send("POST", "/auth-requests/", request, false, true);
    return new AuthRequestResponse(r);
  }

  async getAuthResponse(id: string, accessCode: string): Promise<AuthRequestResponse> {
    const path = `/auth-requests/${id}/response?code=${accessCode}`;
    const r = await this.apiService.send("GET", path, null, false, true);
    return new AuthRequestResponse(r);
  }

  async getAuthRequest(id: string): Promise<AuthRequestResponse> {
    const path = `/auth-requests/${id}`;
    const r = await this.apiService.send("GET", path, null, true, true);
    return new AuthRequestResponse(r);
  }

  async putAuthRequest(id: string, request: PasswordlessAuthRequest): Promise<AuthRequestResponse> {
    const path = `/auth-requests/${id}`;
    const r = await this.apiService.send("PUT", path, request, true, true);
    return new AuthRequestResponse(r);
  }

  async getAuthRequests(): Promise<ListResponse<AuthRequestResponse>> {
    const path = `/auth-requests/`;
    const r = await this.apiService.send("GET", path, null, true, true);
    return new ListResponse(r, AuthRequestResponse);
  }

  async getLastAuthRequest(): Promise<AuthRequestResponse> {
    const requests = await this.getAuthRequests();
    const activeRequests = requests.data.filter((m) => !m.isAnswered && !m.isExpired);
    const lastRequest = activeRequests.sort((a: AuthRequestResponse, b: AuthRequestResponse) =>
      a.creationDate.localeCompare(b.creationDate)
    )[activeRequests.length - 1];
    return lastRequest;
  }
}
