import { ApiHelperService } from "../../abstractions/api-helper.service.abstraction";
import { KeyConnectorApiService as KeyConnectorApiServiceAbstraction } from "../abstractions/key-connector-api.service.abstraction";
import { TokenApiService } from "../abstractions/token-api.service.abstraction";
import { KeyConnectorUserKeyRequest } from "../models/request/key-connector-user-key.request";
import { KeyConnectorUserKeyResponse } from "../models/response/key-connector-user-key.response";

export class KeyConnectorApiServiceImplementation implements KeyConnectorApiServiceAbstraction {
  constructor(
    private apiHelperService: ApiHelperService,
    private tokenApiService: TokenApiService
  ) {}

  async getUserKeyFromKeyConnector(keyConnectorUrl: string): Promise<KeyConnectorUserKeyResponse> {
    const authHeader = await this.tokenApiService.getActiveAccessToken();

    const response = await this.apiHelperService.fetch(
      new Request(keyConnectorUrl + "/user-keys", {
        cache: "no-store",
        method: "GET",
        headers: new Headers({
          Accept: "application/json",
          Authorization: "Bearer " + authHeader,
        }),
      })
    );

    if (response.status !== 200) {
      const error = await this.apiHelperService.handleError(response, false, true);
      return Promise.reject(error);
    }

    return new KeyConnectorUserKeyResponse(await response.json());
  }

  async postUserKeyToKeyConnector(
    keyConnectorUrl: string,
    request: KeyConnectorUserKeyRequest
  ): Promise<void> {
    const authHeader = await this.tokenApiService.getActiveAccessToken();

    const response = await this.apiHelperService.fetch(
      new Request(keyConnectorUrl + "/user-keys", {
        cache: "no-store",
        method: "POST",
        headers: new Headers({
          Accept: "application/json",
          Authorization: "Bearer " + authHeader,
          "Content-Type": "application/json; charset=utf-8",
        }),
        body: JSON.stringify(request),
      })
    );

    if (response.status !== 200) {
      const error = await this.apiHelperService.handleError(response, false, true);
      return Promise.reject(error);
    }
  }

  async getKeyConnectorAlive(keyConnectorUrl: string) {
    const response = await this.apiHelperService.fetch(
      new Request(keyConnectorUrl + "/alive", {
        cache: "no-store",
        method: "GET",
        headers: new Headers({
          Accept: "application/json",
          "Content-Type": "application/json; charset=utf-8",
        }),
      })
    );

    if (response.status !== 200) {
      const error = await this.apiHelperService.handleError(response, false, true);
      return Promise.reject(error);
    }
  }
}
